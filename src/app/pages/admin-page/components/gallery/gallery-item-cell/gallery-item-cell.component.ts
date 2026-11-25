import { Component, computed, inject, input } from '@angular/core';
import { SummaryOf } from 'src/app/services/editor-content/editor-content-types';
import { CollectionsStore } from '../../../services/collections-store.service';

/** A gallery image's row: its thumbnail, caption, collection, and tags. */
@Component({
	selector: 'app-gallery-item-cell',
	templateUrl: './gallery-item-cell.component.html',
	styleUrl: './gallery-item-cell.component.scss'
})
export class GalleryItemCellComponent {
	private collections = inject(CollectionsStore);

	public readonly item = input.required<SummaryOf<'gallery'>>();

	protected readonly collectionTitle = computed(() =>
		this.collections.titleOf('gallery', this.item().collection)
	);
}
