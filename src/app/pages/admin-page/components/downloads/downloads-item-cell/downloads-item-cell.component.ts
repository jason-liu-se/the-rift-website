import { Component, computed, inject, input } from '@angular/core';
import { SummaryOf } from 'src/app/services/editor-content/editor-content-types';
import { CollectionsStore } from '../../../services/collections-store.service';

/** A download's row: its image, title, and collection. */
@Component({
	selector: 'app-downloads-item-cell',
	templateUrl: './downloads-item-cell.component.html',
	styleUrl: './downloads-item-cell.component.scss'
})
export class DownloadsItemCellComponent {
	private collections = inject(CollectionsStore);

	public readonly item = input.required<SummaryOf<'downloads'>>();

	protected readonly collectionTitle = computed(() =>
		this.collections.titleOf('downloads', this.item().collection)
	);
}
