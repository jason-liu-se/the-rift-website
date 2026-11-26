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
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MAX_COLLECTION_TITLE_LENGTH } from 'src/app/config/content-limits';
import { EditorCollection } from 'src/app/interfaces/api-responses';
import { CollectionContentType } from 'src/app/services/editor-content/editor-content-types';
import { EditorContentService } from 'src/app/services/editor-content/editor-content.service';
import { CollectionsStore } from '../../services/collections-store.service';
import { EditorWriteService } from '../../services/editor-write.service';
import { CollectionFormComponent } from '../collection-form/collection-form.component';
import { CollectionsEditor } from '../collections-modal/collections-editor';
import { ItemNoun, countItems } from '../editor-list/bulk-results';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

/** A published collection as the list shows it, with the editor's draft on top. */
interface CollectionRow {
	collection: EditorCollection;
	title: string;
	isVisible: boolean;
	hasDraft: boolean;
	isOpen: boolean;
}

/** A new collection's draft in the list. */
interface NewDraftRow {
	id: string;
	title: string;
	slug?: string;
	isOpen: boolean;
}

/**
 * A gallery's or downloads' collections, and the editor's drafts of new
 * ones, beside the form editing one. Renaming one in place or showing or
 * hiding it changes its draft (opening it in the form); deleting one deletes
 * it with everything in it, at once.
 */
@Component({
	selector: 'app-collections-manager',
	templateUrl: './collections-manager.component.html',
	styleUrl: './collections-manager.component.scss',
	imports: [
		CollectionFormComponent,
		MatButton,
		MatIcon,
		MatIconButton,
		MatTooltip,
		StatusBadgeComponent
	]
})
export class CollectionsManagerComponent {
	private editorContent = inject(EditorContentService);
	private writer = inject(EditorWriteService);
	private store = inject(CollectionsStore);
	private injector = inject(Injector);
	protected readonly editor = inject(CollectionsEditor);
	private form = viewChild<CollectionFormComponent, ElementRef<HTMLElement>>(
		CollectionFormComponent,
		{ read: ElementRef }
	);

	public readonly type = input.required<CollectionContentType>();
	/** How the collection's items are named: "image", "images". */
	public readonly itemNoun = input.required<ItemNoun>();
	/** A collection was deleted. */
	public readonly changed = output<void>();

	protected readonly maxTitleLength = MAX_COLLECTION_TITLE_LENGTH;

	protected readonly session = this.editor.session;
	protected readonly urlPrefix = computed(() =>
		this.type() === 'gallery' ? '/gallery/' : undefined
	);
	protected readonly rows = computed<CollectionRow[]>(() => {
		const session = this.session();
		const drafts = this.editor.editDrafts();
		return (this.store.collections(this.type())() ?? []).map(
			(collection) => {
				const isOpen = session?.targetId() === collection.slug;
				const draft = drafts.get(collection.slug);
				const fields = isOpen ? session!.fields() : draft?.fields;
				return {
					collection,
					title:
						(fields as { title?: string } | undefined)?.title ||
						collection.title,
					isVisible:
						(fields as { visible?: boolean } | undefined)
							?.visible ?? collection.visible,
					hasDraft: isOpen
						? session!.hasUnpublishedChanges()
						: !!draft,
					isOpen
				};
			}
		);
	});
	protected readonly newDraftRows = computed<NewDraftRow[]>(() => {
		const session = this.session();
		return this.editor.newDrafts().map(({ id, fields }) => {
			const isOpen = session?.id() === id;
			const { title, slug } = (isOpen ? session!.fields() : fields) as {
				title?: string;
				slug?: string;
			};
			return { id, title: title || 'Untitled', slug, isOpen };
		});
	});
	/** The form holds something other than a fresh new collection. */
	protected readonly canStartNew = computed(() => {
		const session = this.session();
		return (
			!!session && (session.isEdit() || session.status() !== 'unchanged')
		);
	});

	protected pathOf(slug: string | undefined): string {
		return `${this.urlPrefix() ?? ''}${slug || '…'}`;
	}

	protected countOf(collection: EditorCollection): string {
		return countItems(collection.itemCount, this.itemNoun());
	}

	protected edit(collection: EditorCollection): void {
		this.openInForm(this.editor.edit(collection));
	}

	protected openDraft(id: string): void {
		this.openInForm(this.editor.openDraft(id));
	}

	protected startNew(): void {
		this.editor.startNew();
		this.focusForm();
	}

	/** Renames it in its draft; a blank title goes back to what it was. */
	protected rename(row: CollectionRow, input: HTMLInputElement): void {
		const title = input.value.trim();
		if (!title || title === row.title) {
			input.value = row.title;
			return;
		}
		this.editor.rename(row.collection, title);
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

	protected deleteCollection(collection: EditorCollection): void {
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
