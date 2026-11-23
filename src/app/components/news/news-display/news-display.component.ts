import { Component, Input } from '@angular/core';
import { NewsPost } from 'src/app/interfaces/api-responses';
import { EditButtonComponent } from 'src/app/components/edit-button/edit-button.component';
import { toPlainText } from 'src/app/utilities/markdown';
import { MarkdownComponent } from 'src/app/components/markdown/markdown.component';
import { OptimizedImageComponent } from 'src/app/components/optimized-image/optimized-image.component';

@Component({
	selector: 'app-news-display',
	templateUrl: './news-display.component.html',
	styleUrls: ['./news-display.component.scss'],
	imports: [EditButtonComponent, MarkdownComponent, OptimizedImageComponent]
})
export class NewsDisplayComponent {
	@Input({ required: true }) public newsPosts!: NewsPost[];
	/** Offers editors an Edit link per post (not on previews). */
	@Input() public canEdit = false;

	protected readonly toPlainText = toPlainText;

	public newsPostToDateString(post: NewsPost): string {
		return new Date(post.date).toDateString();
	}

	public editedToDateString(editedAt: string): string {
		return `Edited ${new Date(editedAt).toDateString()}`;
	}
}
