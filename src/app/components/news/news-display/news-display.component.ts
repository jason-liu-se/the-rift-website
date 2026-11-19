import { Component, Input } from '@angular/core';
import { NewsPost } from 'src/app/interfaces/api-responses';
import { OPTIMIZED_IMAGE } from 'src/app/directives/image-fallback.directive';

@Component({
	selector: 'app-news-display',
	templateUrl: './news-display.component.html',
	styleUrls: ['./news-display.component.scss'],
	imports: [OPTIMIZED_IMAGE]
})
export class NewsDisplayComponent {
	@Input({ required: true }) public newsPosts!: NewsPost[];

	public newsPostToDateString(post: NewsPost): string {
		return new Date(post.date).toDateString();
	}
}
