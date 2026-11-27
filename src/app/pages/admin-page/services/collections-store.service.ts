import { Injectable, Signal, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { EditorCollection } from 'src/app/interfaces/api-responses';
import { AdminNotifierService } from 'src/app/services/admin-notifier/admin-notifier.service';
import { CollectionContentType } from 'src/app/services/editor-content/editor-content-types';
import { EditorContentService } from 'src/app/services/editor-content/editor-content.service';
import { describeWriteError } from '../utilities/write-errors';

/**
 * Each content type's collections, fetched once while the admin page is open
 * and again after any collection write. Every admin component reads them here.
 */
@Injectable()
export class CollectionsStore {
	private editorContent = inject(EditorContentService);
	private notifier = inject(AdminNotifierService);

	private readonly collectionsByType = {
		gallery: signal<EditorCollection[] | undefined>(undefined),
		downloads: signal<EditorCollection[] | undefined>(undefined)
	};
	private readonly requests = new Map<CollectionContentType, Subscription>();

	/** The type's collections; undefined until they've loaded. */
	public collections(
		type: CollectionContentType
	): Signal<EditorCollection[] | undefined> {
		if (!this.requests.has(type)) {
			this.reload(type);
		}
		return this.collectionsByType[type].asReadonly();
	}

	/** A collection's title, or its slug until the collections load. */
	public titleOf(type: CollectionContentType, slug: string): string {
		return (
			this.collections(type)()?.find(
				(collection) => collection.slug === slug
			)?.title ?? slug
		);
	}

	public reload(type: CollectionContentType): void {
		this.requests.get(type)?.unsubscribe();
		this.requests.set(
			type,
			this.editorContent.fetchCollections(type).subscribe({
				next: (collections) =>
					this.collectionsByType[type].set(collections),
				error: (error: unknown) =>
					this.notifier.notifyFailure(
						`Couldn't load the collections. ${describeWriteError(error)}`
					)
			})
		);
	}
}
