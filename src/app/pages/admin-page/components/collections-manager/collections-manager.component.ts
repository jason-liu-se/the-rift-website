import {
	Component,
	computed,
	inject,
	input,
	output,
	signal
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Observable, tap } from 'rxjs';
import { MAX_COLLECTION_TITLE_LENGTH } from 'src/app/config/content-limits';
import { EditorCollection } from 'src/app/interfaces/api-responses';
import { CollectionContentType } from 'src/app/services/editor-content/editor-content-types';
import { EditorContentService } from 'src/app/services/editor-content/editor-content.service';
import { CollectionsStore } from '../../services/collections-store.service';
import {
	EditorWrite,
	EditorWriteService
} from '../../services/editor-write.service';
import { CollectionFormComponent } from '../collection-form/collection-form.component';
import { ItemNoun, countItems } from '../editor-list/bulk-results';

/**
 * A gallery's or downloads' collections: rename one in place, show or hide
 * it, delete it with everything in it, or edit it (title and dimensions)
 * beside the list, where new ones are created.
 */
@Component({
	selector: 'app-collections-manager',
	templateUrl: './collections-manager.component.html',
	styleUrl: './collections-manager.component.scss',
	imports: [CollectionFormComponent, MatIcon, MatIconButton, MatTooltip]
})
export class CollectionsManagerComponent {
	private editorContent = inject(EditorContentService);
	private writer = inject(EditorWriteService);
	private store = inject(CollectionsStore);

	public readonly type = input.required<CollectionContentType>();
	/** How the collection's items are named: "image", "images". */
	public readonly itemNoun = input.required<ItemNoun>();
	/** A collection was created, changed, or deleted. */
	public readonly changed = output<void>();

	protected readonly maxTitleLength = MAX_COLLECTION_TITLE_LENGTH;
	/** The slug of the collection open in the form; none for a new one. */
	protected readonly editingSlug = signal<string | undefined>(undefined);

	protected readonly collections = computed(
		() => this.store.collections(this.type())() ?? []
	);
	protected readonly urlPrefix = computed(() =>
		this.type() === 'gallery' ? '/gallery/' : undefined
	);
	protected readonly editing = computed(() =>
		this.collections().find(({ slug }) => slug === this.editingSlug())
	);

	protected pathOf(collection: EditorCollection): string {
		return `${this.urlPrefix() ?? ''}${collection.slug}`;
	}

	protected countOf(collection: EditorCollection): string {
		return countItems(collection.itemCount, this.itemNoun());
	}

	protected edit(collection: EditorCollection): void {
		this.editingSlug.set(collection.slug);
	}

	/** Back to a new collection, the form's other use. */
	protected stopEditing(): void {
		this.editingSlug.set(undefined);
	}

	/** Saves a changed title; a blank one goes back to what it was. */
	protected rename(
		collection: EditorCollection,
		input: HTMLInputElement
	): void {
		const title = input.value.trim();
		if (!title || title === collection.title) {
			input.value = collection.title;
			return;
		}
		this.write({
			request: () =>
				this.editorContent.updateCollection(
					this.type(),
					collection.slug,
					{ title, startingRevision: collection.revision }
				),
			success: `Renamed ${collection.title} to ${title}.`
		}).subscribe();
	}

	protected toggleVisibility(collection: EditorCollection): void {
		this.write({
			request: () =>
				this.editorContent.updateCollection(
					this.type(),
					collection.slug,
					{
						visible: !collection.visible,
						startingRevision: collection.revision
					}
				),
			success: `${collection.visible ? 'Hid' : 'Showed'} ${collection.title}.`
		}).subscribe();
	}

	protected deleteCollection(collection: EditorCollection): void {
		const items = countItems(collection.itemCount, this.itemNoun());
		this.write({
			confirm: {
				title: `Delete ${collection.title}?`,
				message: `This deletes the collection and the ${items} in it. It can't be undone.`,
				confirmLabel: `Delete it and ${items}`
			},
			request: () =>
				this.editorContent.deleteCollection(
					this.type(),
					collection.slug,
					collection.revision
				),
			success: `Deleted ${collection.title} and ${items}.`
		}).subscribe();
	}

	/** Runs the write, then reloads the collections and tells the list. */
	private write(write: EditorWrite): Observable<boolean> {
		return this.writer.run(write).pipe(
			tap(() => {
				this.store.reload(this.type());
				this.changed.emit();
			})
		);
	}
}
