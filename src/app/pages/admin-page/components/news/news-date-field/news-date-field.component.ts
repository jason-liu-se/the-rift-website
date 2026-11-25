import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { formatDateTime } from '../../../utilities/format-date-time';
import { NewsDate } from 'src/app/interfaces/api-requests';
import { DraftSession } from '../../../drafts/draft-session';
import {
	DateChoice,
	PublishSettings,
	findScheduleProblem,
	toDateChoice,
	toLocalInputValue
} from '../../draft-editor/publish-settings';

/**
 * When a news post goes live: now, at a date, or (for an edit) keeping its
 * date. Kept in the draft, shown with the post's fields.
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

	public readonly session = input.required<DraftSession<'news'>>();

	private readonly date = computed(() => this.session().fields().date);
	protected readonly publishedDate = computed(() => {
		const date = this.settings.published()?.date;
		return date ? formatDateTime(date) : undefined;
	});
	protected readonly choice = computed(() =>
		toDateChoice(this.date(), !!this.settings.published())
	);
	/** The scheduled date as the input shows it. */
	protected readonly scheduledAt = computed(() => {
		const date = this.date();
		return date && date !== 'now' ? toLocalInputValue(new Date(date)) : '';
	});
	/** Shown once publishing was tried, so typing a date isn't nagged. */
	protected readonly problem = computed(() =>
		this.settings.wasAttempted()
			? findScheduleProblem(this.date())
			: undefined
	);

	protected minScheduleTime(): string {
		return toLocalInputValue(new Date());
	}

	/** Kept in the draft; scheduling starts at the next hour. */
	protected choose(choice: DateChoice): void {
		const dates: Record<DateChoice, () => NewsDate | undefined> = {
			keep: () => undefined,
			now: () => 'now',
			schedule: () => nextHour().toISOString()
		};
		this.session().update({ date: dates[choice]() });
	}

	/** A half-typed date is blank: the draft keeps the last whole one. */
	protected schedule(localValue: string): void {
		const date = new Date(localValue);
		if (localValue && !Number.isNaN(date.getTime())) {
			this.session().update({ date: date.toISOString() });
		}
	}
}

function nextHour(): Date {
	const date = new Date();
	date.setHours(date.getHours() + 1, 0, 0, 0);
	return date;
}
