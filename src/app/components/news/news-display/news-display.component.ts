import { Component, Input } from '@angular/core';
import { NewsPost } from 'src/app/core/api/api-responses';
import { EditButtonComponent } from 'src/app/shared/ui/edit-button/edit-button.component';
import { toPlainText } from 'src/app/shared/utils/markdown';
import { MarkdownComponent } from 'src/app/shared/ui/markdown/markdown.component';
import { OptimizedImageComponent } from 'src/app/shared/ui/optimized-image/optimized-image.component';

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
