import { Component, computed, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { NewsDisplayComponent } from 'src/app/components/news/news-display/news-display.component';
import {
	MAX_NEWS_CONTENT_LENGTH,
	MAX_NEWS_TITLE_LENGTH
} from 'src/app/config/content-limits';
import { NewsPost } from 'src/app/interfaces/api-responses';
import { DraftSession } from '../../../drafts/draft-session';
import { ImageFieldComponent } from '../../image-field/image-field.component';

/**
 * A news post's fields: title (inline markdown), content (markdown), and an
 * optional image, with a preview as the news page shows it.
 */
@Component({
	selector: 'app-news-form',
	templateUrl: './news-form.component.html',
	styleUrl: './news-form.component.scss',
	imports: [
		FormsModule,
		ImageFieldComponent,
		MatFormField,
		MatHint,
		MatInput,
		MatLabel,
		NewsDisplayComponent
	]
})
export class NewsFormComponent {
	public readonly session = input.required<DraftSession<'news'>>();

	protected readonly maxTitleLength = MAX_NEWS_TITLE_LENGTH;
	protected readonly maxContentLength = MAX_NEWS_CONTENT_LENGTH;
	protected readonly fields = computed(() => this.session().fields());
	protected readonly preview = computed<NewsPost[]>(() => {
		const { title, content, imageUrl } = this.fields();
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

	protected setTitle(title: string): void {
		this.session().update({ title });
	}

	protected setContent(content: string): void {
		this.session().update({ content });
	}

	protected setImageUrl(imageUrl: string): void {
		this.session().update({ imageUrl: imageUrl || null });
	}
}
