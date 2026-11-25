import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { formatDateTime } from '../../../utilities/format-date-time';
import {
	PublishSettings,
	toLocalInputValue
} from '../../draft-editor/publish-settings';

/**
 * When a news post goes live: now, at a date, or (for an edit) keeping its
 * date. Part of the publish settings, shown with the post's fields.
 */
@Component({
	selector: 'app-news-date-field',
	templateUrl: './news-date-field.component.html',
	styleUrl: './news-date-field.component.scss',
	imports: [
		FormsModule,
		MatFormField,
		MatInput,
		MatLabel,
		MatRadioButton,
		MatRadioGroup
	]
})
export class NewsDateFieldComponent {
	protected readonly settings = inject(PublishSettings);

	protected readonly publishedDate = computed(() => {
		const date = this.settings.published()?.date;
		return date ? formatDateTime(date) : undefined;
	});
	/** Shown once publishing was tried, so typing a date isn't nagged. */
	protected readonly problem = computed(() =>
		this.settings.wasAttempted()
			? this.settings.scheduleProblem()
			: undefined
	);

	protected minScheduleTime(): string {
		return toLocalInputValue(new Date());
	}
}
