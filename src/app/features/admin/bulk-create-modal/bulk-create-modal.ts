import {
	Component,
	DestroyRef,
	TemplateRef,
	inject,
	viewChild
} from '@angular/core';
import { Observable, of } from 'rxjs';
import { EditorWriteService } from '../editor-write.service';
import { openModalRoute } from '../modal-route';
import { EditorListStore } from '../editor-list/editor-list.store';
import { GalleryBulkCreate } from '../gallery/gallery-bulk-create/gallery-bulk-create';

/** Adding many gallery images, in a modal over the gallery's list. */
@Component({
	selector: 'app-bulk-create-modal',
	templateUrl: './bulk-create-modal.html',
	imports: [GalleryBulkCreate]
})
export class BulkCreateModal {
	private writer = inject(EditorWriteService);
	private content = viewChild.required<TemplateRef<unknown>>('content');
	private bulkCreate = viewChild(GalleryBulkCreate);

	protected readonly close = openModalRoute(() => this.content(), {
		wide: true
	});

	constructor() {
		// Whatever was published shows in the list.
		const listStore = inject(EditorListStore);
		inject(DestroyRef).onDestroy(() => listStore.reload());
	}

	/** Asks before leaving rows that aren't published yet. */
	public confirmLeave(): Observable<boolean> {
		const count = this.bulkCreate()?.rowCount() ?? 0;
		if (count === 0) {
			return of(true);
		}
		const images = count === 1 ? '1 image' : `${count} images`;
		return this.writer.confirm({
			title: `Close and drop ${images}?`,
			message: "They haven't been published, and won't be kept.",
			confirmLabel: `Drop ${images}`
		});
	}
}
