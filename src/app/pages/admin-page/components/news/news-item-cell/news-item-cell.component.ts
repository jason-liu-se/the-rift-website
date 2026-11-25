import { Component, input } from '@angular/core';
import { MarkdownComponent } from 'src/app/components/markdown/markdown.component';
import { ItemThumbnailComponent } from '../../item-thumbnail/item-thumbnail.component';
import { SummaryOf } from 'src/app/services/editor-content/editor-content-types';

/**
 * A news post's or draft's row: its image and title (its dates are a column
 * of their own).
 */
@Component({
	selector: 'app-news-item-cell',
	imports: [ItemThumbnailComponent, MarkdownComponent],
	templateUrl: './news-item-cell.component.html',
	styleUrl: './news-item-cell.component.scss'
})
export class NewsItemCellComponent {
	public readonly item = input.required<Partial<SummaryOf<'news'>>>();
}
