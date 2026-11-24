import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { CollectionContentType } from 'src/app/services/editor-content/editor-content-types';
import { CollectionsStore } from '../../services/collections-store.service';
import { BULK_ACTION_HOST } from '../editor-list/bulk-action-host';

/** A bulk action for types with collections: move to another collection. */
@Component({
	selector: 'app-move-bulk-action',
	templateUrl: './move-bulk-action.component.html',
	styleUrl: './move-bulk-action.component.scss',
	imports: [
		FormsModule,
		MatButton,
		MatFormField,
		MatLabel,
		MatOption,
		MatSelect
	]
})
export class MoveBulkActionComponent {
	private host = inject(BULK_ACTION_HOST);

	protected readonly collections = inject(CollectionsStore).collections(
		this.host.type() as CollectionContentType
	);
	protected readonly targetCollection = signal('');

	protected move(): void {
		this.host.runBulkAction({
			action: 'move',
			collection: this.targetCollection()
		});
	}
}
