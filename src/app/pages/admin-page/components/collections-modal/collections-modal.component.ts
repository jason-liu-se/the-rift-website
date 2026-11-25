import { NgTemplateOutlet } from '@angular/common';
import {
	Component,
	DestroyRef,
	TemplateRef,
	computed,
	inject,
	viewChild
} from '@angular/core';
import { EDITOR_TYPES, toCollectionType } from '../../editor-types';
import { openModalRoute } from '../../utilities/modal-route';
import { CollectionsManagerComponent } from '../collections-manager/collections-manager.component';
import { EditorListStore } from '../editor-list/editor-list.store';
import { ModalFooterSlot } from '../modal-shell/modal-footer-slot';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';

/** A type's collections, in a modal over its list (`/admin/<type>/collections`). */
@Component({
	selector: 'app-collections-modal',
	template: `<ng-template #content>
		<app-modal-shell
			[heading]="config().label + ' collections'"
			(closed)="close()"
		>
			@if (collectionType(); as type) {
				<app-collections-manager
					[type]="type"
					[itemNoun]="config().noun"
					(changed)="isChanged = true"
				/>
			}
			<div modalFooter>
				<ng-container *ngTemplateOutlet="footer.template() ?? null" />
			</div>
		</app-modal-shell>
	</ng-template>`,
	imports: [
		CollectionsManagerComponent,
		ModalShellComponent,
		NgTemplateOutlet
	],
	providers: [ModalFooterSlot]
})
export class CollectionsModalComponent {
	private content = viewChild.required<TemplateRef<unknown>>('content');
	private listStore = inject(EditorListStore);

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
	/** The form's save button, kept in view below the list and form. */
	protected readonly footer = inject(ModalFooterSlot);
	protected isChanged = false;

	constructor() {
		// A renamed, hidden, or deleted collection changes the list.
		inject(DestroyRef).onDestroy(() => {
			if (this.isChanged) {
				this.listStore.reload();
			}
		});
	}
}
