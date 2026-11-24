import {
	Component,
	ElementRef,
	afterNextRender,
	computed,
	inject,
	input,
	output,
	signal,
	viewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { EMPTY, Observable, catchError, filter } from 'rxjs';
import {
	DraftPublishRequest,
	EditorContentType
} from 'src/app/interfaces/api-requests';
import { AdminNotifierService } from 'src/app/services/admin-notifier/admin-notifier.service';
import { ItemOf } from 'src/app/services/editor-content/editor-content-types';
import { DraftSession, SaveStage } from '../../drafts/draft-session';
import { describeWriteError } from '../../utilities/write-errors';
import { itemName } from '../editor-list/item-name';
import { findMissingFields } from '../../drafts/draft-fields';
import { EDITOR_TYPES } from '../../editor-types';
import { EditorWriteService } from '../../services/editor-write.service';
import { DraftConflictComponent } from './draft-conflict/draft-conflict.component';

const STATUS_TEXT: Record<SaveStage, string> = {
	unchanged: '',
	local: 'Saved in this browser',
	saving: 'Saving…',
	saved: 'Saved',
	failed: "Couldn't save to the server",
	conflict: 'Needs your choice',
	published: 'Published'
};

/** When a news post goes live: as it was (edits), now, or a date. */
type DateChoice = 'keep' | 'now' | 'schedule';

/** What the published item was, for the publish options' defaults. */
export interface PublishedState {
	visible: boolean;
	/** News only (ISO 8601). */
	date?: string;
}

/**
 * Around one tool's form (projected): the draft's autosave status and
 * "unpublished changes" tell, undo and redo, any conflict to resolve, and
 * publishing (visible or hidden; for news, now or a date).
 */
@Component({
	selector: 'app-draft-editor',
	templateUrl: './draft-editor.component.html',
	styleUrl: './draft-editor.component.scss',
	imports: [
		DraftConflictComponent,
		FormsModule,
		MatIcon,
		MatIconButton,
		MatButton,
		MatFormField,
		MatInput,
		MatLabel,
		MatRadioButton,
		MatRadioGroup
	]
})
export class DraftEditorComponent<T extends EditorContentType> {
	private notifier = inject(AdminNotifierService);
	private writer = inject(EditorWriteService);
	private heading = viewChild.required<ElementRef<HTMLElement>>('heading');

	public readonly session = input.required<DraftSession<T>>();
	/** The item being edited, if it's published. */
	public readonly published = input<PublishedState>();

	public readonly publishedItem = output<ItemOf<T>>();
	public readonly closed = output<void>();

	private readonly config = computed(() => EDITOR_TYPES[this.session().type]);
	protected readonly noun = computed(() => this.config().noun);
	/** News: choose when it goes live. */
	protected readonly hasDate = computed(() => this.config().hasDate);
	protected readonly statusText = computed(
		() => STATUS_TEXT[this.session().status()]
	);
	protected readonly title = computed(() => {
		const published = this.published();
		const name = itemName(this.session().fields() as object);
		return published ? `Editing ${name}` : `New ${this.config().noun.one}`;
	});
	protected readonly isVisible = signal(true);
	protected readonly dateChoice = signal<DateChoice>('now');
	protected readonly scheduledAt = signal('');
	protected readonly isPublishing = signal(false);
	/** "Title, Content": what publishing still needs filled in. */
	protected readonly missingFields = computed(() => {
		const { requiredFields, fieldLabels } = this.config();
		return findMissingFields(
			this.session().fields() as Record<string, unknown>,
			requiredFields as readonly string[]
		)
			.map((key) => (fieldLabels as Record<string, string>)[key])
			.join(', ');
	});
	/** There's a draft to discard (anything saved here or on the server). */
	protected readonly hasDraft = computed(
		() => this.session().status() !== 'unchanged'
	);

	constructor() {
		afterNextRender(() => {
			const published = this.published();
			this.isVisible.set(published?.visible ?? true);
			this.dateChoice.set(published ? 'keep' : 'now');
			this.heading().nativeElement.focus();
		});
	}

	protected publish(): void {
		this.runPublish(this.session().publish(this.publishOptions()));
	}

	protected publishAsNew(): void {
		this.runPublish(this.session().publishAsNew(this.publishOptions()));
	}

	protected overwrite(): void {
		this.session()
			.resolveItemConflict('overwrite')
			.subscribe({ complete: () => this.publish() });
	}

	protected retrySave(): void {
		this.session()
			.saveNow()
			.pipe(catchError(() => EMPTY))
			.subscribe();
	}

	protected discard(): void {
		this.writer
			.run({
				confirm: {
					title: 'Discard this draft?',
					message:
						'Your changes will be lost. The published version stays.',
					confirmLabel: 'Discard'
				},
				request: () => this.session().discard()
			})
			.pipe(filter(Boolean))
			.subscribe(() => this.closed.emit());
	}

	protected close(): void {
		this.session().close();
		this.closed.emit();
	}

	/** Today's earliest time a post can be scheduled for, for the date input. */
	protected minScheduleTime(): string {
		return toLocalInputValue(new Date());
	}

	private publishOptions(): DraftPublishRequest {
		const options: DraftPublishRequest = { visible: this.isVisible() };
		if (!this.hasDate()) {
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

	private runPublish(publish: Observable<ItemOf<T>>): void {
		if (this.dateChoice() === 'schedule' && this.hasDate()) {
			const scheduled = new Date(this.scheduledAt());
			if (!(scheduled.getTime() > Date.now())) {
				this.notifier.notifyFailure(
					'Pick a date and time in the future.'
				);
				return;
			}
		}
		this.isPublishing.set(true);
		publish.subscribe({
			next: (item) => {
				this.isPublishing.set(false);
				this.notifier.notifySuccess(
					`Published ${itemName(item as object)}.`
				);
				this.publishedItem.emit(item);
			},
			error: (error: unknown) => {
				this.isPublishing.set(false);
				if (!this.session().conflict()) {
					this.notifier.notifyFailure(
						error instanceof Error && !('status' in error)
							? error.message
							: describeWriteError(error)
					);
				}
			}
		});
	}
}

/** A date as a `datetime-local` input's value, in the editor's time zone. */
function toLocalInputValue(date: Date): string {
	const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
	return local.toISOString().slice(0, 16);
}
