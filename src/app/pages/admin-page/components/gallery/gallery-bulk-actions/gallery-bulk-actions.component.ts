import { Component, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { BULK_ACTION_HOST } from '../../editor-list/bulk-action-host';
import { MoveBulkActionComponent } from '../../move-bulk-action/move-bulk-action.component';
import { TagInputComponent } from '../../tag-input/tag-input.component';

/** The gallery's own bulk actions: move to a collection, add or remove tags. */
@Component({
	selector: 'app-gallery-bulk-actions',
	templateUrl: './gallery-bulk-actions.component.html',
	styleUrl: './gallery-bulk-actions.component.scss',
	imports: [MatButton, MoveBulkActionComponent, TagInputComponent]
})
export class GalleryBulkActionsComponent {
	private host = inject(BULK_ACTION_HOST);

	protected readonly tags = signal<string[]>([]);

	protected changeTags(action: 'add-tags' | 'remove-tags'): void {
		this.host.runBulkAction({ action, tags: this.tags() });
		this.tags.set([]);
	}
}
