import { Component, Input } from '@angular/core';
import { NewsPost } from 'src/app/interfaces/api-responses';
import { MarkdownComponent } from 'src/app/components/markdown/markdown.component';
import { OptimizedImageComponent } from 'src/app/components/optimized-image/optimized-image.component';

@Component({
	selector: 'app-news-display',
	templateUrl: './news-display.component.html',
	styleUrls: ['./news-display.component.scss'],
	imports: [MarkdownComponent, OptimizedImageComponent]
})
export class NewsDisplayComponent {
	@Input({ required: true }) public newsPosts!: NewsPost[];

	public newsPostToDateString(post: NewsPost): string {
		return new Date(post.date).toDateString();
	}

	public editedToDateString(editedAt: string): string {
		return `Edited ${new Date(editedAt).toDateString()}`;
	}
}
