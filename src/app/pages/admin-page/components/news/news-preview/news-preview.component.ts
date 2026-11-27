import { Component, computed, inject, input } from '@angular/core';
import { NewsDisplayComponent } from 'src/app/components/news/news-display/news-display.component';
import { NewsPost } from 'src/app/core/api/api-responses';
import { DraftSession } from '../../../drafts/draft-session';
import { PublishSettings } from '../../draft-editor/publish-settings';

/** A news post's draft as the news page shows it. */
@Component({
	selector: 'app-news-preview',
	templateUrl: './news-preview.component.html',
	imports: [NewsDisplayComponent]
})
export class NewsPreviewComponent {
	private settings = inject(PublishSettings);

	public readonly session = input.required<DraftSession<'news'>>();

	/** When it'll go live, as the draft says: as before, now, or later. */
	private readonly date = computed(() => {
		const date = this.session().fields().date;
		if (date && date !== 'now') {
			return date;
		}
		return (
			(!date && this.settings.published()?.date) ||
			new Date().toISOString()
		);
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
