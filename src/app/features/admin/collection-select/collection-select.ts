import {
	Component,
	booleanAttribute,
	computed,
	inject,
	input,
	model
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { CollectionsStore } from '../collections-store';
import { CollectionContentType } from '../editor-content/editor-content-types';

/** Chooses one of a content type's collections, by slug. */
@Component({
	selector: 'app-collection-select',
	templateUrl: './collection-select.html',
	styleUrl: './collection-select.scss',
	imports: [FormsModule, MatFormField, MatLabel, MatOption, MatSelect]
})
export class CollectionSelect {
	private store = inject(CollectionsStore);

	public readonly type = input.required<CollectionContentType>();
	public readonly slug = model<string | undefined>();
	public readonly label = input('Collection');
	public readonly required = input(false, { transform: booleanAttribute });

	protected readonly collections = computed(
		() => this.store.collections(this.type())() ?? []
	);
}
