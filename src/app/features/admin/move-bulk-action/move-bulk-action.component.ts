import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { CollectionContentType } from 'src/app/features/admin/editor-content/editor-content-types';
import { CollectionsStore } from '../collections-store.service';
import { BULK_ACTION_HOST } from '../editor-list/bulk-action-host';

/** A bulk action for types with collections: move to another collection. */
@Component({
	selector: 'app-move-bulk-action',
	templateUrl: './move-bulk-action.component.html',
	imports: [MatButton, MatIcon, MatMenu, MatMenuItem, MatMenuTrigger]
})
export class MoveBulkActionComponent {
	private host = inject(BULK_ACTION_HOST);

	protected readonly collections = inject(CollectionsStore).collections(
		this.host.type() as CollectionContentType
	);

	protected move(collection: string): void {
		this.host.runBulkAction({ action: 'move', collection });
	}
}
