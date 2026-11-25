import { Component, computed, inject, input } from '@angular/core';
import { SummaryOf } from 'src/app/services/editor-content/editor-content-types';
import { CollectionsStore } from '../../../services/collections-store.service';
import { ItemThumbnailComponent } from '../../item-thumbnail/item-thumbnail.component';

/** A gallery image's or draft's card: its image, caption, collection, and tags. */
@Component({
	selector: 'app-gallery-item-cell',
	imports: [ItemThumbnailComponent],
	templateUrl: './gallery-item-cell.component.html',
	styleUrl: './gallery-item-cell.component.scss'
})
export class GalleryItemCellComponent {
	private collections = inject(CollectionsStore);

	public readonly item = input.required<Partial<SummaryOf<'gallery'>>>();

	protected readonly details = computed(() => {
		const { collection, tags = [] } = this.item();
		return [
			collection && this.collections.titleOf('gallery', collection),
			tags.join(', ')
		]
			.filter(Boolean)
			.join(' · ');
	});
}
