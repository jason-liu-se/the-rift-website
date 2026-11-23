import { Component } from '@angular/core';
import { EditorListComponent } from '../editor-list/editor-list.component';
import { FilterOption } from '../editor-list/list-filters/list-filters.component';
import { NewsPost } from 'src/app/interfaces/api-responses';
import { NewsDisplayComponent } from '../../../../components/news/news-display/news-display.component';

/** Placeholder: will create news posts. The preview shows sample data. */
@Component({
	selector: 'app-news-tool',
	templateUrl: './news-tool.component.html',
	styleUrls: ['../admin-tool.scss'],
	imports: [EditorListComponent, NewsDisplayComponent]
})
export class NewsToolComponent {
	protected readonly noun = { one: 'post', many: 'posts' };
	protected readonly searchFields: FilterOption[] = [
		{ value: 'title', label: 'Title' },
		{ value: 'content', label: 'Content' }
	];

	public readonly preview: NewsPost = {
		id: 'preview',
		title: 'Sample news post',
		date: '2026-01-01T00:00:00.000Z',
		content: 'The body of the news post will appear here.',
		imageUrl: '/assets/general-background-images/spawn-walkway-1.webp'
	};
}
