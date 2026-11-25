import { Component, input } from '@angular/core';
import { MarkdownComponent } from 'src/app/components/markdown/markdown.component';
import { formatDateTime } from '../../../utilities/format-date-time';
import { SummaryOf } from 'src/app/services/editor-content/editor-content-types';

/** A news post's row: its title and dates. */
@Component({
	selector: 'app-news-item-cell',
	imports: [MarkdownComponent],
	templateUrl: './news-item-cell.component.html',
	styleUrl: './news-item-cell.component.scss'
})
export class NewsItemCellComponent {
	public readonly item = input.required<SummaryOf<'news'>>();
	protected readonly formatDateTime = formatDateTime;
}
