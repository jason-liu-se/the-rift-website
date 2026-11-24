import { Component, input } from '@angular/core';
import { SummaryOf } from 'src/app/services/editor-content/editor-content-types';

/** A gallery image's row: its thumbnail, caption, collection, and tags. */
@Component({
	selector: 'app-gallery-item-cell',
	imports: [],
	templateUrl: './gallery-item-cell.component.html',
	styleUrl: './gallery-item-cell.component.scss'
})
export class GalleryItemCellComponent {
	public readonly item = input.required<SummaryOf<'gallery'>>();
}
