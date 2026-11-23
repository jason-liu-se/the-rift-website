import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { EditorCollection } from 'src/app/interfaces/api-responses';
import { BulkActionOf } from 'src/app/services/editor-content/editor-content-types';
import { TagInputComponent } from '../../tag-input/tag-input.component';

/** The gallery's own bulk actions: move to a collection, add or remove tags. */
@Component({
	selector: 'app-gallery-bulk-actions',
	templateUrl: './gallery-bulk-actions.component.html',
	styleUrl: './gallery-bulk-actions.component.scss',
	imports: [
		FormsModule,
		MatButton,
		MatFormField,
		MatLabel,
		MatOption,
		MatSelect,
		TagInputComponent
	]
})
export class GalleryBulkActionsComponent {
	public readonly collections = input<readonly EditorCollection[]>([]);
	public readonly runAction = output<BulkActionOf<'gallery'>>();

	protected readonly targetCollection = signal('');
	protected readonly tags = signal<string[]>([]);

	protected move(): void {
		this.runAction.emit({
			action: 'move',
			collection: this.targetCollection()
		});
	}

	protected changeTags(action: 'add-tags' | 'remove-tags'): void {
		this.runAction.emit({ action, tags: this.tags() });
		this.tags.set([]);
	}
}
