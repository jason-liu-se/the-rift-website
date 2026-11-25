import { Component, input } from '@angular/core';
import { SummaryOf } from 'src/app/services/editor-content/editor-content-types';

/** A map season's or draft's row: its number and dimension count. */
@Component({
	selector: 'app-maps-item-cell',
	imports: [],
	templateUrl: './maps-item-cell.component.html',
	styleUrl: './maps-item-cell.component.scss'
})
export class MapsItemCellComponent {
	public readonly item = input.required<Partial<SummaryOf<'maps'>>>();
}
