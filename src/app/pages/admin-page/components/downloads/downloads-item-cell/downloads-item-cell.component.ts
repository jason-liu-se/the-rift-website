import { Component, input } from '@angular/core';
import { SummaryOf } from 'src/app/services/editor-content/editor-content-types';

/** A download's row: its title, collection, and sort order. */
@Component({
	selector: 'app-downloads-item-cell',
	imports: [],
	templateUrl: './downloads-item-cell.component.html',
	styleUrl: './downloads-item-cell.component.scss'
})
export class DownloadsItemCellComponent {
	public readonly item = input.required<SummaryOf<'downloads'>>();
}
