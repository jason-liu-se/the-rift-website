import { Component, computed, input } from '@angular/core';
import { NewsDisplayComponent } from 'src/app/components/news/news-display/news-display.component';
import { NewsPost } from 'src/app/interfaces/api-responses';
import { DraftSession } from '../../../drafts/draft-session';

/** A news post's draft as the news page shows it. */
@Component({
	selector: 'app-news-preview',
	template: `<app-news-display [newsPosts]="preview()" />`,
	imports: [NewsDisplayComponent]
})
export class NewsPreviewComponent {
	public readonly session = input.required<DraftSession<'news'>>();

	protected readonly preview = computed<NewsPost[]>(() => {
		const { title, content, imageUrl } = this.session().fields();
		return [
			{
				id: 'preview',
				title: title || 'Untitled',
				content: content ?? '',
				date: new Date().toISOString(),
				...(imageUrl && { imageUrl })
			}
		];
	});
}
