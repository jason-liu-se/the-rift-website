import { Component, input } from '@angular/core';
import { SummaryOf } from 'src/app/services/editor-content/editor-content-types';
import { ItemThumbnailComponent } from '../../item-thumbnail/item-thumbnail.component';

/** A download's row: its image and title (its collection is a column). */
@Component({
	selector: 'app-downloads-item-cell',
	imports: [ItemThumbnailComponent],
	templateUrl: './downloads-item-cell.component.html',
	styleUrl: './downloads-item-cell.component.scss'
})
export class DownloadsItemCellComponent {
	public readonly item = input.required<SummaryOf<'downloads'>>();
}
