import { Component, Input } from '@angular/core';
import { NewsPost } from 'src/app/core/api/api-responses';
import { EditButton } from 'src/app/shared/ui/edit-button/edit-button';
import { toPlainText } from 'src/app/shared/utils/markdown';
import { Markdown } from 'src/app/shared/ui/markdown/markdown';
import { OptimizedImage } from 'src/app/shared/ui/optimized-image/optimized-image';

@Component({
	selector: 'app-news-display',
	templateUrl: './news-display.html',
	styleUrls: ['./news-display.scss'],
	imports: [EditButton, Markdown, OptimizedImage]
})
export class NewsDisplay {
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
