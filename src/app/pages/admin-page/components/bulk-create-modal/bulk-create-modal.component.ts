import {
	Component,
	DestroyRef,
	TemplateRef,
	inject,
	viewChild
} from '@angular/core';
import { openModalRoute } from '../../utilities/modal-route';
import { EditorListStore } from '../editor-list/editor-list.store';
import { GalleryBulkCreateComponent } from '../gallery/gallery-bulk-create/gallery-bulk-create.component';

/** Adding many gallery images, in a modal over the gallery's list. */
@Component({
	selector: 'app-bulk-create-modal',
	template: `<ng-template #content>
		<app-gallery-bulk-create (closed)="close()" />
	</ng-template>`,
	imports: [GalleryBulkCreateComponent]
})
export class BulkCreateModalComponent {
	private content = viewChild.required<TemplateRef<unknown>>('content');

	protected readonly close = openModalRoute(() => this.content());

	constructor() {
		// Whatever was published shows in the list.
		const listStore = inject(EditorListStore);
		inject(DestroyRef).onDestroy(() => listStore.reload());
	}
}
