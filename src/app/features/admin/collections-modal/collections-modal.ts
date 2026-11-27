import { NgTemplateOutlet } from '@angular/common';
import {
	Component,
	DestroyRef,
	TemplateRef,
	computed,
	inject,
	viewChild
} from '@angular/core';
import { EDITOR_TYPES, toCollectionType } from '../editor-types';
import { openModalRoute } from '../modal-route';
import { CollectionsEditor } from './collections-editor';
import { CollectionsManager } from '../collections-manager/collections-manager';
import { EditorListStore } from '../editor-list/editor-list.store';
import { ModalFooterSlot } from '../modal-shell/modal-footer-slot';
import { ModalShell } from '../modal-shell/modal-shell';

/** A type's collections, in a modal over its list (`/admin/<type>/collections`). */
@Component({
	selector: 'app-collections-modal',
	templateUrl: './collections-modal.html',
	imports: [CollectionsManager, ModalShell, NgTemplateOutlet],
	providers: [CollectionsEditor, ModalFooterSlot]
})
export class CollectionsModal {
	private content = viewChild.required<TemplateRef<unknown>>('content');
	private listStore = inject(EditorListStore);
	private editor = inject(CollectionsEditor);

	protected readonly config = computed(
		() => EDITOR_TYPES[this.listStore.type()]
	);
	protected readonly collectionType = computed(() =>
		toCollectionType(this.listStore.type())
	);
	// Wide: the list beside a form that may hold dimension cards.
	protected readonly close = openModalRoute(() => this.content(), {
		wide: true
	});
	/** The form's footer, kept in view below the list and form. */
	protected readonly footer = inject(ModalFooterSlot);
	protected isChanged = false;

	constructor() {
		const type = this.collectionType();
		if (type) {
			this.editor.start(type);
		}
		// A published or deleted collection changes the list.
		inject(DestroyRef).onDestroy(() => {
			if (this.isChanged || this.editor.hasPublished()) {
				this.listStore.reload();
			}
		});
	}
}
