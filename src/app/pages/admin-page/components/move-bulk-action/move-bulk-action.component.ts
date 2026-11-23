import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { BulkMoveUpdate } from 'src/app/interfaces/api-requests';
import { EditorCollection } from 'src/app/interfaces/api-responses';

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
	public readonly collections = input<readonly EditorCollection[]>([]);
	public readonly runAction = output<Omit<BulkMoveUpdate, 'items'>>();

	protected readonly targetCollection = signal('');

	protected move(): void {
		this.runAction.emit({
			action: 'move',
			collection: this.targetCollection()
		});
	}
}
