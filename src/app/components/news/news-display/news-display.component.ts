import { Component, Input } from '@angular/core';
import { NewsPost } from 'src/app/interfaces/api-responses';
import { OptimizedImageComponent } from 'src/app/components/optimized-image/optimized-image.component';

@Component({
	selector: 'app-news-display',
	templateUrl: './news-display.component.html',
	styleUrls: ['./news-display.component.scss'],
	imports: [OptimizedImageComponent]
})
export class NewsDisplayComponent {
	@Input({ required: true }) public newsPosts!: NewsPost[];

	public newsPostToDateString(post: NewsPost): string {
		return new Date(post.date).toDateString();
	}
}
