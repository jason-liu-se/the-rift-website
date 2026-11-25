import { Injectable, Provider, inject, signal } from '@angular/core';
import { ErrorStateMatcher } from '@angular/material/core';
import { NewsDate } from 'src/app/interfaces/api-requests';

/** When a news post goes live: as it was (edits), now, or a date. */
export type DateChoice = 'keep' | 'now' | 'schedule';

/** What the published item was, for the publish options' defaults. */
export interface PublishedState {
	/** News only (ISO 8601). */
	date?: string;
}

/**
 * The published item's state (for the defaults the draft leaves out) and
 * whether publishing was tried, shared by the editor's footer and the
 * projected form's fields. The draft holds the choices themselves (`visible`,
 * news's `date`). Provided per editor modal (`providePublishSettings`).
 */
@Injectable()
export class PublishSettings {
	public readonly published = signal<PublishedState | undefined>(undefined);
	/** Publishing was tried: required fields left blank show as errors. */
	public readonly wasAttempted = signal(false);

	/** Field errors show once a field is touched, or publishing was tried. */
	public readonly errorStateMatcher: ErrorStateMatcher = {
		isErrorState: (control) =>
			!!control?.invalid && (control.touched || this.wasAttempted())
	};

	public reset(published: PublishedState | undefined): void {
		this.published.set(published);
		this.wasAttempted.set(false);
	}
}

/**
 * A news draft's `date` as a choice: none keeps an edit's date (or is now,
 * for a new post), and any date but `now` is scheduled.
 */
export function toDateChoice(
	date: NewsDate | undefined,
	isEdit: boolean
): DateChoice {
	if (!date) {
		return isEdit ? 'keep' : 'now';
	}
	return date === 'now' ? 'now' : 'schedule';
}

/** Why a scheduled date can't be published, or undefined if it can. */
export function findScheduleProblem(
	date: NewsDate | undefined
): string | undefined {
	if (!date || date === 'now') {
		return undefined;
	}
	return new Date(date).getTime() > Date.now()
		? undefined
		: 'Choose a time in the future.';
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
