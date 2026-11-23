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
	of,
	toArray
} from 'rxjs';
import { EDITOR_PAGE_SIZE, MAX_BULK_ITEMS } from 'src/app/config/admin';
import {
	BulkItemRef,
	EditorContentType
} from 'src/app/interfaces/api-requests';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { BulkItemResult, BulkResponse } from 'src/app/interfaces/api-responses';
import { DraftsService } from 'src/app/services/drafts/drafts.service';
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

const DRAFTS = { one: 'draft', many: 'drafts' };

/**
 * Runs a bulk action on a selection: in requests of at most MAX_BULK_ITEMS,
 * one after another, with one summary per request as its response arrives.
 */
@Injectable({ providedIn: 'root' })
export class BulkActionRunnerService {
	private editorContent = inject(EditorContentService);
	private drafts = inject(DraftsService);

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

	/**
	 * Deletes the editor's drafts, one request each (there's no bulk delete
	 * for drafts), with one summary for them all. One already gone counts as
	 * deleted.
	 */
	public deleteDrafts(ids: readonly string[]): Observable<BulkSummary> {
		return from(ids).pipe(
			concatMap((id) =>
				this.drafts.deleteDraft(id).pipe(
					map((): BulkItemResult<never> => ({ id, outcome: 'ok' })),
					catchError((error: unknown) =>
						of<BulkItemResult<never>>(
							error instanceof HttpErrorResponse &&
								error.status === HttpStatusCode.NotFound
								? { id, outcome: 'ok' }
								: {
										id,
										outcome: 'invalid',
										reason: describeWriteError(error)
									}
						)
					)
				)
			),
			toArray(),
			map((results) => summarizeBulkResults('delete', results, DRAFTS))
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
