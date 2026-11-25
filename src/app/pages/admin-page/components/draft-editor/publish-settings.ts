import { Injectable, Provider, computed, inject, signal } from '@angular/core';
import { ErrorStateMatcher } from '@angular/material/core';
import { DraftPublishRequest } from 'src/app/interfaces/api-requests';

/** When a news post goes live: as it was (edits), now, or a date. */
export type DateChoice = 'keep' | 'now' | 'schedule';

/** What the published item was, for the publish options' defaults. */
export interface PublishedState {
	visible: boolean;
	/** News only (ISO 8601). */
	date?: string;
}

/**
 * How the open item will publish (visibility, news's date) and whether
 * publishing was tried, shared by the editor's footer and the projected
 * form's fields. Provided per editor modal (`providePublishSettings`).
 */
@Injectable()
export class PublishSettings {
	public readonly published = signal<PublishedState | undefined>(undefined);
	public readonly isVisible = signal(true);
	public readonly dateChoice = signal<DateChoice>('now');
	/** A `datetime-local` value, in the editor's time zone. */
	public readonly scheduledAt = signal('');
	/** Publishing was tried: required fields left blank show as errors. */
	public readonly wasAttempted = signal(false);

	public readonly scheduleProblem = computed(() => {
		if (this.dateChoice() !== 'schedule') {
			return undefined;
		}
		const time = new Date(this.scheduledAt()).getTime();
		if (Number.isNaN(time)) {
			return 'Choose a date and time.';
		}
		return time > Date.now() ? undefined : 'Choose a time in the future.';
	});

	/** Field errors show once a field is touched, or publishing was tried. */
	public readonly errorStateMatcher: ErrorStateMatcher = {
		isErrorState: (control) =>
			!!control?.invalid && (control.touched || this.wasAttempted())
	};

	/** Starts from the published item's visibility and date, if any. */
	public reset(published: PublishedState | undefined): void {
		this.published.set(published);
		this.isVisible.set(published?.visible ?? true);
		this.dateChoice.set(published ? 'keep' : 'now');
		this.scheduledAt.set('');
		this.wasAttempted.set(false);
	}

	public toRequest(hasDate: boolean): DraftPublishRequest {
		const options: DraftPublishRequest = { visible: this.isVisible() };
		if (!hasDate) {
			return options;
		}
		switch (this.dateChoice()) {
			case 'now':
				return { ...options, date: 'now' };
			case 'schedule':
				return {
					...options,
					date: new Date(this.scheduledAt()).toISOString()
				};
			default:
				return options;
		}
	}
}

/** For the editor modal: the settings, and its fields' error matcher. */
export function providePublishSettings(): Provider[] {
	return [
		PublishSettings,
		{
			provide: ErrorStateMatcher,
			useFactory: () => inject(PublishSettings).errorStateMatcher
		}
	];
}

/** A date as a `datetime-local` input's value, in the editor's time zone. */
export function toLocalInputValue(date: Date): string {
	const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
	return local.toISOString().slice(0, 16);
}
