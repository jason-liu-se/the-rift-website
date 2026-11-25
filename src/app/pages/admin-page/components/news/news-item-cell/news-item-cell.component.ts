import { Component, input } from '@angular/core';
import { MarkdownComponent } from 'src/app/components/markdown/markdown.component';
import { SummaryOf } from 'src/app/services/editor-content/editor-content-types';

/** A news post's row: its title (its dates are a column of their own). */
@Component({
	selector: 'app-news-item-cell',
	imports: [MarkdownComponent],
	templateUrl: './news-item-cell.component.html',
	styleUrl: './news-item-cell.component.scss'
})
export class NewsItemCellComponent {
	public readonly item = input.required<SummaryOf<'news'>>();
}
