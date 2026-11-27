import { Component, computed, inject, input, output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { EMPTY, catchError, filter } from 'rxjs';
import { DraftType } from 'src/app/core/api/api-requests';
import { discardDraft } from '../drafts/discard-draft';
import { DraftFields } from '../drafts/draft-fields';
import { DraftSession, SaveStage } from '../drafts/draft-session';
import { EditorWriter } from '../editor-writer';
import { VisibilityToggle } from '../visibility-toggle/visibility-toggle';
import { UNPUBLISHED_CHANGES } from '../status-badge/status-badge';

/** The publish button's labels (see `publishLabel`), widest included. */
const PUBLISH_LABELS = [
	'Publish',
	'Publish changes',
	'Save as hidden',
	'Schedule',
	'Publishing…'
] as const;

const STATUS_TEXT: Record<SaveStage, string> = {
	unchanged: '',
	local: 'Saved in this browser',
	saving: 'Saving…',
	saved: 'Saved',
	failed: "Couldn't save",
	conflict: 'Resolve the conflict above to publish',
	published: 'Published'
};

/**
 * A draft editor's footer: whether there are unpublished changes, how saving
 * is going (or why it can't publish), and Discard, visibility, and Publish.
 */
@Component({
	selector: 'app-draft-footer',
	templateUrl: './draft-footer.html',
	styleUrl: './draft-footer.scss',
	imports: [MatButton, MatIcon, VisibilityToggle]
})
export class DraftFooter {
	private writer = inject(EditorWriter);

	public readonly session = input.required<DraftSession<DraftType>>();
	/** Editing a published item (rather than a new one). */
	public readonly isEdit = input.required<boolean>();
	/** What it's of: "post". */
	public readonly noun = input.required<string>();
	/** Why it can't publish, shown in place of the save status. */
	public readonly problem = input<string>();
	/** It'll publish later (a scheduled news post). */
	public readonly isScheduled = input(false);
	public readonly isPublishing = input(false);

	public readonly publish = output<void>();
	/** The draft was discarded, once confirmed. */
	public readonly discarded = output<void>();

	protected readonly unpublishedChanges = UNPUBLISHED_CHANGES;
	protected readonly status = computed(() => this.session().status());
	protected readonly statusText = computed(() => {
		const status = this.status();
		if (status === 'unchanged') {
			return this.isEdit() ? 'No changes yet' : '';
		}
		return STATUS_TEXT[status];
	});
	/** There's a draft to discard (anything saved here or on the server). */
	protected readonly hasDraft = computed(() => this.status() !== 'unchanged');
	protected readonly isVisible = computed(
		() => this.session().fields().visible ?? true
	);
	protected readonly publishLabels = PUBLISH_LABELS;
	private readonly publishLabel = computed(() => {
		if (this.isScheduled()) {
			return 'Schedule';
		}
		if (!this.isVisible()) {
			return 'Save as hidden';
		}
		return this.isEdit() ? 'Publish changes' : 'Publish';
	});
	protected readonly currentPublishLabel = computed(() =>
		this.isPublishing() ? 'Publishing…' : this.publishLabel()
	);

	/** Kept in the draft, like its fields (and undone like them). */
	protected setVisible(visible: boolean): void {
		this.session().update({ visible } as DraftFields<DraftType>);
	}

	protected discard(): void {
		discardDraft(this.writer, this.session(), this.noun(), this.isEdit())
			.pipe(filter(Boolean))
			.subscribe(() => this.discarded.emit());
	}

	protected retrySave(): void {
		this.session()
			.saveNow()
			.pipe(catchError(() => EMPTY))
			.subscribe();
	}
}
