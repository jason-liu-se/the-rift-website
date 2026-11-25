import { Component, input } from '@angular/core';
import { SummaryOf } from 'src/app/services/editor-content/editor-content-types';
import { formatDateTime } from '../../../utilities/format-date-time';

/** A news post's dates, in the list's Post date column. */
@Component({
	selector: 'app-news-date-cell',
	template: `{{ formatDateTime(item().date) }}
		@if (item().editedAt) {
			<span class="details"
				>Edited {{ formatDateTime(item().editedAt!) }}</span
			>
		}`,
	styleUrl: './news-date-cell.component.scss'
})
export class NewsDateCellComponent {
	public readonly item = input.required<SummaryOf<'news'>>();
	protected readonly formatDateTime = formatDateTime;
}
