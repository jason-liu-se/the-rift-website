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
import {
	BulkItemRef,
	EditorContentType,
	GalleryImageCreateRequest
} from 'src/app/core/api/api-requests';
import {
	BulkItemResult,
	BulkResponse,
	EditorGalleryImage
} from 'src/app/core/api/api-responses';
import {
	BulkActionOf,
	BulkUpdateRequestOf,
	ItemOf,
	ListQueryOf,
	SummaryOf
} from 'src/app/features/admin/editor-content/editor-content-types';
import { EditorContentApi } from 'src/app/features/admin/editor-content/editor-content-api';
import { DraftStore } from '../drafts/draft-store';
import { describeWriteError } from '../write-errors';
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
export class BulkActionRunner {
	private editorContent = inject(EditorContentApi);
	private draftStore = inject(DraftStore);

	public run<T extends EditorContentType>(
		type: T,
		action: BulkActionOf<T>,
		refs: readonly BulkItemRef[]
	): Observable<BulkItemResult<ItemOf<T>>[]> {
		return this.inChunks<BulkItemRef, ItemOf<T>>(
			refs,
			({ id }) => id,
			(items) => this.send(type, action, items)
		);
	}

	/** Creates gallery images; each result's `id` is the image's `createId`. */
	public createGalleryImages(
		images: readonly GalleryImageCreateRequest[]
	): Observable<BulkItemResult<EditorGalleryImage>[]> {
		return this.inChunks<GalleryImageCreateRequest, EditorGalleryImage>(
			images,
			({ createId }) => createId,
			(items) => this.editorContent.bulkCreateGalleryImages({ items })
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

	private inChunks<I, R>(
		items: readonly I[],
		idOf: (item: I) => string,
		send: (chunk: I[]) => Observable<BulkResponse<unknown>>
	): Observable<BulkItemResult<R>[]> {
		return from(toChunks(items, MAX_BULK_ITEMS)).pipe(
			concatMap((chunk) =>
				send(chunk).pipe(
					map(({ results }) => results as BulkItemResult<R>[]),
					catchError((error: unknown) => {
						const reason = describeWriteError(error);
						return of(
							chunk.map((item): BulkItemResult<R> => ({
								id: idOf(item),
								outcome: 'invalid',
								reason
							}))
						);
					})
				)
			),
			reduce<BulkItemResult<R>[], BulkItemResult<R>[]>(
				(all, results) => [...all, ...results],
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
