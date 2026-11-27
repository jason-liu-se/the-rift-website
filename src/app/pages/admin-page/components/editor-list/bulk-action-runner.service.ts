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
import { EDITOR_PAGE_SIZE, MAX_BULK_ITEMS } from 'src/app/core/config/admin';
import { BulkItemRef, EditorContentType } from 'src/app/core/api/api-requests';
import { BulkItemResult, BulkResponse } from 'src/app/core/api/api-responses';
import {
	BulkActionOf,
	BulkUpdateRequestOf,
	ItemOf,
	ListQueryOf,
	SummaryOf
} from 'src/app/services/editor-content/editor-content-types';
import { EditorContentService } from 'src/app/services/editor-content/editor-content.service';
import { DraftStore } from '../../drafts/draft-store.service';
import { describeWriteError } from '../../utilities/write-errors';
import {
	BulkSummary,
	DRAFT_NOUN,
	summarizeBulkResults,
	toChunks
} from './bulk-results';

/**
 * Runs a bulk action on a selection: in requests of at most MAX_BULK_ITEMS,
 * one after another, answering every item's result once all are done (a
 * request that failed as a whole counts its items `invalid`, with why).
 */
@Injectable({ providedIn: 'root' })
export class BulkActionRunnerService {
	private editorContent = inject(EditorContentService);
	private draftStore = inject(DraftStore);

	public run<T extends EditorContentType>(
		type: T,
		action: BulkActionOf<T>,
		refs: readonly BulkItemRef[]
	): Observable<BulkItemResult<ItemOf<T>>[]> {
		return from(toChunks(refs, MAX_BULK_ITEMS)).pipe(
			concatMap((items) =>
				this.send(type, action, items).pipe(
					map(
						({ results }) => results as BulkItemResult<ItemOf<T>>[]
					),
					catchError((error: unknown) => {
						const reason = describeWriteError(error);
						return of(
							items.map(({ id }): BulkItemResult<ItemOf<T>> => ({
								id,
								outcome: 'invalid',
								reason
							}))
						);
					})
				)
			),
			reduce<BulkItemResult<ItemOf<T>>[], BulkItemResult<ItemOf<T>>[]>(
				(all, results) => [...all, ...results],
				[]
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
				this.draftStore.delete(id).pipe(
					map((): BulkItemResult<never> => ({ id, outcome: 'ok' })),
					catchError((error: unknown) =>
						of<BulkItemResult<never>>({
							id,
							outcome: 'invalid',
							reason: describeWriteError(error)
						})
					)
				)
			),
			toArray(),
			map((results) =>
				summarizeBulkResults('delete', results, DRAFT_NOUN)
			)
		);
	}

	/** Every item matching `query` (all pages), for "select all matching". */
	public fetchAllMatching<T extends EditorContentType>(
		type: T,
		query: ListQueryOf<T>
	): Observable<SummaryOf<T>[]> {
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
			reduce<{ page: { items: SummaryOf<T>[] } }, SummaryOf<T>[]>(
				(items, { page }) => [...items, ...page.items],
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
