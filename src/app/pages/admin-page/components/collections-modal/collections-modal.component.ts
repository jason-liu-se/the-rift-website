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
		</app-modal-shell>
	</ng-template>`,
	imports: [CollectionsManagerComponent, ModalShellComponent]
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
	protected readonly close = openModalRoute(() => this.content());
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
