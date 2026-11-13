import { Component } from '@angular/core';
import { NewsItem } from 'src/app/interfaces/api-responses';
import { NewsDisplayComponent } from '../../news/news-display/news-display.component';

/** Placeholder: will create news posts. The preview shows sample data. */
@Component({
	selector: 'app-news-tool',
	templateUrl: './news-tool.component.html',
	imports: [NewsDisplayComponent]
})
export class NewsToolComponent {
	public readonly preview: NewsItem = {
		id: 'preview',
		title: 'Sample news post',
		date: '2026-01-01T00:00:00.000Z',
		content: 'The body of the news post will appear here.',
		bannerImg: '/assets/general-background-images/spawn-walkway-1.webp'
	};
}
