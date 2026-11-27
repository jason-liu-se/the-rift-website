import { Component, input } from '@angular/core';
import { formatDateTime } from '../../../../utilities/format-date-time';

/** A date and time ("Now" for `now`), and another date below it, labelled. */
@Component({
	selector: 'app-date-cell',
	templateUrl: './date-cell.component.html',
	styleUrl: './date-cell.component.scss'
})
export class DateCellComponent {
	/** ISO 8601, or `now`: a new news post's draft goes live when published. */
	public readonly date = input<string>();
	public readonly secondary = input<{ label: string; date: string }>();

	protected readonly formatDateTime = formatDateTime;
}
