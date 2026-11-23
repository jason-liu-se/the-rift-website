import { Injectable, inject } from '@angular/core';
import {
	EMPTY,
	Observable,
	concatMap,
	expand,
	from,
	map,
	reduce,
	catchError,
	of
} from 'rxjs';
import { EDITOR_PAGE_SIZE, MAX_BULK_ITEMS } from 'src/app/config/admin';
import {
	BulkItemRef,
	EditorContentType
} from 'src/app/interfaces/api-requests';
import { BulkResponse } from 'src/app/interfaces/api-responses';
import {
	BulkActionOf,
	BulkUpdateRequestOf,
	ListQueryOf
} from 'src/app/services/editor-content/editor-content-types';
import { EditorContentService } from 'src/app/services/editor-content/editor-content.service';
import { describeWriteError } from '../../utilities/write-errors';
import {
	BulkSummary,
	ItemNoun,
	summarizeBulkResults,
	toChunks
} from './bulk-results';

/**
 * Runs a bulk action on a selection: in requests of at most MAX_BULK_ITEMS,
 * one after another, with one summary per request as its response arrives.
 */
@Injectable({ providedIn: 'root' })
export class BulkActionRunnerService {
	private editorContent = inject(EditorContentService);

	public run<T extends EditorContentType>(
		type: T,
		action: BulkActionOf<T>,
		refs: readonly BulkItemRef[],
		noun: ItemNoun
	): Observable<BulkSummary> {
		return from(toChunks(refs, MAX_BULK_ITEMS)).pipe(
			concatMap((items) =>
				this.send(type, action, items).pipe(
					map(({ results }) =>
						summarizeBulkResults(action.action, results, noun)
					),
					catchError((error: unknown) =>
						of({
							message: describeWriteError(error),
							hasFailures: true
						})
					)
				)
			)
		);
	}

	/** Every item matching `query` (all pages), for "select all matching". */
	public fetchAllMatching<T extends EditorContentType>(
		type: T,
		query: ListQueryOf<T>
	): Observable<BulkItemRef[]> {
		const fetchPage = (startIndex: number) =>
			this.editorContent
				.fetchItems(type, {
					...query,
					startIndex,
					limit: EDITOR_PAGE_SIZE
				})
				.pipe(map((page) => ({ page, startIndex })));
		return fetchPage(0).pipe(
			expand(({ page, startIndex }) => {
				const next = startIndex + EDITOR_PAGE_SIZE;
				return next < page.total && page.items.length > 0
					? fetchPage(next)
					: EMPTY;
			}),
			reduce<
				{ page: { items: { id: string; revision: number }[] } },
				BulkItemRef[]
			>(
				(refs, { page }) => [
					...refs,
					...page.items.map(({ id, revision }) => ({
						id,
						startingRevision: revision
					}))
				],
				[]
			)
		);
	}

	private send<T extends EditorContentType>(
		type: T,
		action: BulkActionOf<T>,
		items: BulkItemRef[]
	): Observable<BulkResponse<unknown>> {
		if (action.action === 'delete') {
			return this.editorContent.bulkDelete(type, { items });
		}
		return this.editorContent.bulkUpdate(type, {
			...action,
			items
		} as BulkUpdateRequestOf<T>);
	}
}
