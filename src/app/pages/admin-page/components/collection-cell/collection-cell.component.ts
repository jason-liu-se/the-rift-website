import { Component, computed, inject, input } from '@angular/core';
import { CollectionsStore } from '../../services/collections-store.service';
import { toCollectionType } from '../../editor-types';
import { EditorListStore } from '../editor-list/editor-list.store';

/** An item's collection, by title, in the list's Collection column. */
@Component({
	selector: 'app-collection-cell',
	template: '{{ title() }}',
	// Sized by its column (the site's base style would size it otherwise).
	styles: ':host { font-size: inherit; }'
})
export class CollectionCellComponent {
	private collections = inject(CollectionsStore);
	private type = inject(EditorListStore).type;

	public readonly item = input.required<{ collection?: string }>();

	protected readonly title = computed(() => {
		const type = toCollectionType(this.type());
		const { collection } = this.item();
		return type && collection
			? this.collections.titleOf(type, collection)
			: (collection ?? '');
	});
}
