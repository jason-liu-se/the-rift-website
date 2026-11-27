import { Injectable, inject } from '@angular/core';
import {
	EMPTY,
	Observable,
	catchError,
	concat,
	concatMap,
	defer,
	filter,
	from,
	mergeMap,
	tap
} from 'rxjs';
import { MAX_UPLOAD_FILES } from 'src/app/core/config/uploads';
import { COLLECTION_TYPES } from '../../collection-type-configs';
import { BulkActionRunner } from '../../editor-list/bulk-action-runner';
import {
	BulkSummary,
	summarizeBulkResults,
	toChunks
} from '../../editor-list/bulk-results';
import { ImageUploader } from '../../image-upload/image-uploader';
import { describeWriteError } from '../../write-errors';
import { BulkImageRow, IMAGE_NOUN, toCreateRequest } from './bulk-image-rows';

/** What happened to a row, or to all of them (a summary to show). */
export type BulkPublishEvent =
	| { kind: 'uploaded'; id: string; imageUrl: string }
	| { kind: 'problem'; id: string; problem: string }
	| { kind: 'published'; id: string }
	| { kind: 'summary'; summary: BulkSummary };

/** Uploads and publishes the rows of a bulk gallery creation. */
@Injectable({ providedIn: 'root' })
export class GalleryBulkPublisher {
	private uploads = inject(ImageUploader);
	private runner = inject(BulkActionRunner);

	/**
	 * Uploads the rows' files not yet uploaded, then creates every row with an
	 * image (pasted, uploaded before, or just now). Give it only ready rows.
	 */
	public publish(
		rows: readonly BulkImageRow[]
	): Observable<BulkPublishEvent> {
		const imageUrls = new Map(
			rows.flatMap((row) =>
				row.imageUrl ? [[row.id, row.imageUrl]] : []
			)
		);
		return concat(
			this.uploadFiles(
				rows.filter((row) => row.file && !row.imageUrl)
			).pipe(
				tap((event) => {
					if (event.kind === 'uploaded') {
						imageUrls.set(event.id, event.imageUrl);
					}
				})
			),
			defer(() =>
				this.create(
					rows.flatMap((row) => {
						const imageUrl = imageUrls.get(row.id);
						return imageUrl ? [{ ...row, imageUrl }] : [];
					})
				)
			)
		);
	}

	/**
	 * By collection (each its own album), at most MAX_UPLOAD_FILES a request.
	 * Summarises only failed requests.
	 */
	private uploadFiles(
		rows: readonly BulkImageRow[]
	): Observable<BulkPublishEvent> {
		const collections = [...new Set(rows.map((row) => row.collection))];
		const batches = collections.flatMap((collection) =>
			toChunks(
				rows.filter((row) => row.collection === collection),
				MAX_UPLOAD_FILES
			).map((chunk) => ({ collection, chunk }))
		);
		return from(batches).pipe(
			concatMap(({ collection, chunk }) => {
				const album = COLLECTION_TYPES.gallery.uploadAlbum(collection);
				if (!album) {
					return EMPTY;
				}
				return this.uploads
					.uploadImages(
						chunk.map((row) => row.file!),
						album
					)
					.pipe(
						filter((event) => event.type === 'done'),
						mergeMap((event) =>
							event.response.results.map(
								(result, index): BulkPublishEvent =>
									'url' in result
										? {
												kind: 'uploaded',
												id: chunk[index].id,
												imageUrl: result.url
											}
										: {
												kind: 'problem',
												id: chunk[index].id,
												problem: `Upload failed: ${result.error}`
											}
							)
						),
						catchError((error: unknown) =>
							from<BulkPublishEvent[]>([
								...chunk.map((row): BulkPublishEvent => ({
									kind: 'problem',
									id: row.id,
									problem: 'Upload failed.'
								})),
								{
									kind: 'summary',
									summary: {
										message: `Couldn't upload ${chunk.length} images. ${describeWriteError(error)}`,
										hasFailures: true
									}
								}
							])
						)
					);
			})
		);
	}

	private create(
		rows: readonly BulkImageRow[]
	): Observable<BulkPublishEvent> {
		if (rows.length === 0) {
			return EMPTY;
		}
		return this.runner.createGalleryImages(rows.map(toCreateRequest)).pipe(
			mergeMap((results): BulkPublishEvent[] => [
				...results.map((result): BulkPublishEvent => {
					if (result.outcome === 'ok') {
						return { kind: 'published', id: result.id };
					}
					return {
						kind: 'problem',
						id: result.id,
						problem:
							result.outcome === 'invalid'
								? result.reason
								: 'Not published; try again.'
					};
				}),
				{
					kind: 'summary',
					summary: summarizeBulkResults('create', results, IMAGE_NOUN)
				}
			])
		);
	}
}
