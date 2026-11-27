import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Component, computed, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import {
	MAX_NEWS_CONTENT_LENGTH,
	MAX_NEWS_TITLE_LENGTH
} from 'src/app/core/config/content-limits';
import { DraftSession } from '../../drafts/draft-session';
import { isNearLimit } from '../../near-limit';
import { ImageField } from '../../image-field/image-field';
import { NewsDateField } from '../news-date-field/news-date-field';

/**
 * A news post's fields: title (inline markdown), content (markdown), an
 * optional image, and when it goes live.
 */
@Component({
	selector: 'app-news-form',
	templateUrl: './news-form.html',
	styleUrl: './news-form.scss',
	imports: [
		CdkTextareaAutosize,
		FormsModule,
		ImageField,
		MatFormField,
		MatHint,
		MatInput,
		MatLabel,
		NewsDateField
	]
})
export class NewsForm {
	public readonly session = input.required<DraftSession<'news'>>();

	protected readonly maxTitleLength = MAX_NEWS_TITLE_LENGTH;
	protected readonly maxContentLength = MAX_NEWS_CONTENT_LENGTH;
	protected readonly fields = computed(() => this.session().fields());
	protected readonly isNearLimit = isNearLimit;

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
