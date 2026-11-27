import { COLLECTION_TYPES } from '../collection-type-configs';
import {
	Component,
	ElementRef,
	afterNextRender,
	computed,
	inject,
	input,
	output,
	viewChild,
	Injector
} from '@angular/core';
import { Observable } from 'rxjs';
import { EditorCollection } from 'src/app/core/api/api-responses';
import { CollectionContentType } from 'src/app/features/admin/editor-content/editor-content-types';
import { EditorContentApi } from 'src/app/features/admin/editor-content/editor-content-api';
import { CollectionsStore } from '../collections-store';
import { EditorWriter } from '../editor-writer';
import { CollectionForm } from '../collection-form/collection-form';
import { CollectionsEditor } from '../collections-modal/collections-editor';
import { ItemNoun, countItems } from '../editor-list/bulk-results';
import { CollectionCardContent, toCollectionCards } from './collection-cards';
import { CollectionList } from './collection-list/collection-list';

/**
 * A gallery's or downloads' collections, and the editor's drafts of new
 * ones, as cards that open in the form beside them. Showing or hiding one
 * changes its draft (opening it in the form); deleting a published one
 * deletes it with everything in it, at once.
 */
@Component({
	selector: 'app-collections-manager',
	templateUrl: './collections-manager.html',
	styleUrl: './collections-manager.scss',
	imports: [CollectionForm, CollectionList]
})
export class CollectionsManager {
	private editorContent = inject(EditorContentApi);
	private writer = inject(EditorWriter);
	private store = inject(CollectionsStore);
	private injector = inject(Injector);
	protected readonly editor = inject(CollectionsEditor);
	private form = viewChild<CollectionForm, ElementRef<HTMLElement>>(
		CollectionForm,
		{ read: ElementRef }
	);

	public readonly type = input.required<CollectionContentType>();
	/** How the collection's items are named: "image", "images". */
	public readonly itemNoun = input.required<ItemNoun>();
	/** A collection was deleted. */
	public readonly changed = output<void>();

	protected readonly session = this.editor.session;
	protected readonly cards = computed(() => {
		const session = this.session();
		return toCollectionCards({
			newDrafts: this.editor.newDrafts(),
			editDrafts: this.editor.editDrafts(),
			collections: this.store.collections(this.type())() ?? [],
			open: session && {
				draftId: session.id(),
				targetSlug: session.targetId(),
				fields: session.fields(),
				hasUnpublishedChanges: session.hasUnpublishedChanges()
			},
			urlPrefix: COLLECTION_TYPES[this.type()].pathPrefix,
			itemNoun: this.itemNoun()
		});
	});
	/** The form holds something other than a fresh new collection. */
	protected readonly canStartNew = computed(() => {
		const session = this.session();
		return (
			!!session && (session.isEdit() || session.status() !== 'unchanged')
		);
	});

	protected open(card: CollectionCardContent): void {
		this.openInForm(this.editor.open(card.target));
	}

	protected startNew(): void {
		this.editor.startNew();
		this.focusForm();
	}

	protected delete(card: CollectionCardContent): void {
		const { target, title } = card;
		if (typeof target !== 'string') {
			this.deleteCollection(target);
			return;
		}
		this.writer
			.run({
				confirm: {
					title: `Delete ${title}?`,
					message: "It hasn't been published, so it'll be gone.",
					confirmLabel: 'Delete'
				},
				request: () => this.editor.discardNewDraft(target)
			})
			.subscribe();
	}

	/** Once open, moves to the form (below the list on phones). */
	private openInForm(opening: Observable<unknown>): void {
		opening.subscribe(() => this.focusForm());
	}

	private focusForm(): void {
		afterNextRender(
			() =>
				this.form()
					?.nativeElement.querySelector<HTMLElement>('h3')
					?.focus(),
			{ injector: this.injector }
		);
	}

	private deleteCollection(collection: EditorCollection): void {
		const items = countItems(collection.itemCount, this.itemNoun());
		this.writer
			.run({
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
			})
			.subscribe((isDeleted) => {
				this.store.reload(this.type());
				if (isDeleted) {
					this.editor.noteDeleted(collection.slug);
					this.changed.emit();
				}
			});
	}
}
