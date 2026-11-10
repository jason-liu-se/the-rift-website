import { Component, Input } from '@angular/core';
import { NewsItem } from 'src/app/interfaces/api-responses';

@Component({
	selector: 'app-news-display',
	templateUrl: './news-display.component.html',
	styleUrls: ['./news-display.component.scss']
})
export class NewsDisplayComponent {
	@Input({ required: true }) public newsItems!: NewsItem[];

	public newsItemToDateString(item: NewsItem): string {
		return new Date(item.date).toDateString();
	}
}
