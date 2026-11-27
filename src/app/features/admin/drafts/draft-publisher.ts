import {
	Signal,
	WritableSignal,
	computed,
	inject,
	signal
} from '@angular/core';
import { Observable, filter } from 'rxjs';
import { AdminNotifier } from '../admin-notifier';
import { DraftType } from 'src/app/core/api/api-requests';
import { DraftItemOf } from '../editor-content/editor-content-types';
import { EditorWriter } from '../editor-writer';
import { describeWriteError } from '../write-errors';
import { discardDraft } from './discard-draft';
import { DraftSession } from './draft-session';

/** What differs between the editors that publish drafts (items, collections). */
export interface DraftPublisherOptions<T extends DraftType> {
	session: Signal<DraftSession<T>>;
	/** What it's of: "post". */
	noun: () => string;
	/** Editing a published one (rather than a new one). */
	isEdit: () => boolean;
	/** Publishing was tried, so problems show. */
	wasAttempted: WritableSignal<boolean>;
	/** Why it can't publish, or undefined if it can. */
	findProblem: () => string | undefined;
	/** Its name in the success message. */
	nameOf: (published: DraftItemOf<T>) => string;
	/** A failure's message, when the editor knows a better one. */
	describeFailure?: (error: unknown) => string | undefined;
	/** A publish attempt stopped at a problem. */
	onProblem?: () => void;
	/** Publishing found a conflict, which the editor's conflict panel shows. */
	onConflict?: () => void;
	onPublished: (published: DraftItemOf<T>) => void;
	onDiscarded: () => void;
}

/**
 * Publishes the editor's draft: checks for problems first, reports the
 * result, and runs the conflict panel's ways out. Create it in an injection
 * context.
 */
export class DraftPublisher<T extends DraftType> {
	private notifier = inject(AdminNotifier);
	private writer = inject(EditorWriter);

	public readonly isPublishing = signal(false);
	/** Shown once publishing was tried. */
	public readonly problem = computed(() =>
		this.options.wasAttempted() ? this.options.findProblem() : undefined
	);

	constructor(private readonly options: DraftPublisherOptions<T>) {}

	public publish(): void {
		// The draft holds the choices (visibility, a news date).
		this.run(() => this.options.session().publish({}));
	}

	/** The conflict's way out when the published one was deleted. */
	public publishAsNew(): void {
		this.run(() => this.options.session().publishAsNew({}));
	}

	public overwrite(): void {
		this.options
			.session()
			.resolveItemConflict('overwrite')
			.subscribe({ complete: () => this.publish() });
	}

	public discard(): void {
		const { session, noun, isEdit, onDiscarded } = this.options;
		discardDraft(this.writer, session(), noun(), isEdit())
			.pipe(filter(Boolean))
			.subscribe(() => onDiscarded());
	}

	private run(publish: () => Observable<DraftItemOf<T>>): void {
		const { session, wasAttempted, onProblem, onConflict } = this.options;
		wasAttempted.set(true);
		if (this.problem()) {
			onProblem?.();
			return;
		}
		this.isPublishing.set(true);
		publish().subscribe({
			next: (published) => {
				this.isPublishing.set(false);
				this.notifier.notifySuccess(
					`Published ${this.options.nameOf(published)}.`
				);
				this.options.onPublished(published);
			},
			error: (error: unknown) => {
				this.isPublishing.set(false);
				if (session().conflict()) {
					onConflict?.();
					return;
				}
				this.notifier.notifyFailure(this.describe(error));
			}
		});
	}

	private describe(error: unknown): string {
		// A local error (the draft couldn't be saved first) has its own message.
		return (
			this.options.describeFailure?.(error) ??
			(error instanceof Error && !('status' in error)
				? error.message
				: describeWriteError(error))
		);
	}
}
