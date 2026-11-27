import { Component, input } from '@angular/core';
import { formatDateTime } from '../../../format-date-time';

/** A date and time ("Now" for `now`), and another date below it, labelled. */
@Component({
	selector: 'app-date-cell',
	templateUrl: './date-cell.html',
	styleUrl: './date-cell.scss'
})
export class DateCell {
	/** ISO 8601, or `now`: a new news post's draft goes live when published. */
	public readonly date = input<string>();
	public readonly secondary = input<{ label: string; date: string }>();

	protected readonly formatDateTime = formatDateTime;
}
