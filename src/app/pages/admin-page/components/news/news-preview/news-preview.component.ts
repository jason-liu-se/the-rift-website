import { Component, computed, inject, input } from '@angular/core';
import { NewsDisplayComponent } from 'src/app/components/news/news-display/news-display.component';
import { NewsPost } from 'src/app/interfaces/api-responses';
import { DraftSession } from '../../../drafts/draft-session';
import { PublishSettings } from '../../draft-editor/publish-settings';

/** A news post's draft as the news page shows it. */
@Component({
	selector: 'app-news-preview',
	template: `<app-news-display [newsPosts]="preview()" />`,
	imports: [NewsDisplayComponent]
})
export class NewsPreviewComponent {
	private settings = inject(PublishSettings);

	public readonly session = input.required<DraftSession<'news'>>();

	/** When it'll go live, as the date field says: as before, now, or later. */
	private readonly date = computed(() => {
		const published = this.settings.published()?.date;
		switch (this.settings.dateChoice()) {
			case 'keep':
				return published ?? new Date().toISOString();
			case 'schedule': {
				const scheduled = new Date(this.settings.scheduledAt());
				return Number.isNaN(scheduled.getTime())
					? new Date().toISOString()
					: scheduled.toISOString();
			}
			default:
				return new Date().toISOString();
		}
	});

	protected readonly preview = computed<NewsPost[]>(() => {
		const { title, content, imageUrl } = this.session().fields();
		return [
			{
				id: 'preview',
				title: title || 'Untitled',
				content: content ?? '',
				date: this.date(),
				...(imageUrl && { imageUrl })
			}
		];
	});
}
