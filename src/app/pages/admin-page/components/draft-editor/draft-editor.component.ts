import {
	Component,
	ElementRef,
	Injector,
	Type,
	afterNextRender,
	computed,
	inject,
	input,
	output,
	signal,
	viewChild
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
	MatButtonToggle,
	MatButtonToggleGroup
} from '@angular/material/button-toggle';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { EMPTY, Observable, catchError, filter } from 'rxjs';
import { EditorContentType } from 'src/app/interfaces/api-requests';
import { AdminNotifierService } from 'src/app/services/admin-notifier/admin-notifier.service';
import { ItemOf } from 'src/app/services/editor-content/editor-content-types';
import { DraftSession, SaveStage } from '../../drafts/draft-session';
import { findMissingFields } from '../../drafts/draft-fields';
import { EDITOR_TYPES } from '../../editor-types';
import { EditorWriteService } from '../../services/editor-write.service';
import { describeWriteError } from '../../utilities/write-errors';
import { itemName } from '../editor-list/item-name';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';
import { DraftConflictComponent } from './draft-conflict/draft-conflict.component';
import { PublishSettings } from './publish-settings';

const STATUS_TEXT: Record<SaveStage, string> = {
	unchanged: '',
	local: 'Saved in this browser',
	saving: 'Saving…',
	saved: 'Saved',
	failed: "Couldn't save",
	conflict: 'Resolve the conflict above to publish',
	published: 'Published'
};

/** What the editor's ⋮ menu can do with the published item. */
export interface PublishedItemActions {
	duplicate(): void;
	remove(): void;
	/** The item's page on the site, if it's live. */
	publicPath?: string;
}

/**
 * Around one tool's form (projected) in the editor modal: undo and redo, any
 * conflict to resolve, a preview beside the fields (on wide screens), and a
 * footer that always shows whether there are unpublished changes, how saving
 * is going, and the publish options.
 */
@Component({
	selector: 'app-draft-editor',
	templateUrl: './draft-editor.component.html',
	styleUrl: './draft-editor.component.scss',
	imports: [
		DraftConflictComponent,
		FormsModule,
		MatButton,
		MatButtonToggle,
		MatButtonToggleGroup,
		MatIcon,
		MatIconButton,
		MatMenu,
		MatMenuItem,
		MatMenuTrigger,
		MatTooltip,
		ModalShellComponent,
		NgComponentOutlet
	],
	host: {
		'(keydown)': 'handleShortcuts($event)'
	}
})
export class DraftEditorComponent<T extends EditorContentType> {
	private notifier = inject(AdminNotifierService);
	private writer = inject(EditorWriteService);
	private injector = inject(Injector);
	private host = inject<ElementRef<HTMLElement>>(ElementRef);
	private shell = viewChild.required(ModalShellComponent);

	public readonly session = input.required<DraftSession<T>>();
	/** The published item's actions, when editing one. */
	public readonly itemActions = input<PublishedItemActions>();

	public readonly publishedItem = output<ItemOf<T>>();
	public readonly closed = output<void>();

	protected readonly settings = inject(PublishSettings);
	private readonly config = computed(() => EDITOR_TYPES[this.session().type]);
	protected readonly noun = computed(() => this.config().noun);
	protected readonly preview = computed(
		() => this.config().preview as Type<unknown> | undefined
	);
	/** Mobile: the fields or the preview, one at a time. */
	protected readonly pane = signal<'fields' | 'preview'>('fields');
	protected readonly isEdit = computed(() => !!this.settings.published());
	protected readonly title = computed(() =>
		this.isEdit()
			? itemName(this.session().fields() as object)
			: `New ${this.noun().one}`
	);
	protected readonly status = computed(() => this.session().status());
	protected readonly statusText = computed(() => {
		const status = this.status();
		if (status === 'unchanged') {
			return this.isEdit() ? 'No changes yet' : '';
		}
		return STATUS_TEXT[status];
	});
	protected readonly hasUnpublishedChanges = computed(
		() => this.session().hasChanges() && this.status() !== 'published'
	);
	protected readonly isPublishing = signal(false);
	private readonly missingFields = computed(() =>
		findMissingFields(
			this.session().fields() as Record<string, unknown>,
			this.config().requiredFields as readonly string[]
		)
	);
	/** Shown after a publish attempt, until every required field is filled. */
	protected readonly publishProblem = computed(() => {
		if (!this.settings.wasAttempted()) {
			return undefined;
		}
		if (this.missingFields().length > 0) {
			return 'Fields marked * are required.';
		}
		return this.config().hasDate
			? this.settings.scheduleProblem()
			: undefined;
	});
	protected readonly publishLabel = computed(() => {
		if (this.config().hasDate && this.settings.dateChoice() === 'schedule') {
			return 'Schedule';
		}
		if (!this.settings.isVisible()) {
			return 'Save as hidden';
		}
		return this.isEdit() ? 'Publish changes' : 'Publish';
	});
	/** There's a draft to discard (anything saved here or on the server). */
	protected readonly hasDraft = computed(() => this.status() !== 'unchanged');

	protected publish(): void {
		this.runPublish(() =>
			this.session().publish(this.settings.toRequest(this.config().hasDate))
		);
	}

	protected publishAsNew(): void {
		this.runPublish(() =>
			this.session().publishAsNew(
				this.settings.toRequest(this.config().hasDate)
			)
		);
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
		const noun = this.noun().one;
		this.writer
			.run({
				confirm: this.isEdit()
					? {
							title: 'Discard your changes?',
							message: `The published ${noun} stays as it is.`,
							confirmLabel: 'Discard changes'
						}
					: {
							title: `Discard this ${noun}?`,
							message: "It hasn't been published, so it'll be gone.",
							confirmLabel: 'Discard'
						},
				request: () => this.session().discard()
			})
			.pipe(filter(Boolean))
			.subscribe(() => this.closed.emit());
	}

	protected close(): void {
		if (this.hasUnpublishedChanges()) {
			this.notifier.notifySuccess(
				'Your changes are kept. Find them under Unpublished changes.'
			);
		}
		this.session().close();
		this.closed.emit();
	}

	/** Ctrl+Z and Ctrl+Shift+Z (or Ctrl+Y) outside a text field's own undo. */
	protected handleShortcuts(event: KeyboardEvent): void {
		const isTyping = !!(event.target as HTMLElement).closest?.(
			'input, textarea'
		);
		if (isTyping || !(event.ctrlKey || event.metaKey)) {
			return;
		}
		const key = event.key.toLowerCase();
		if (key === 'z' && !event.shiftKey && this.session().canUndo()) {
			event.preventDefault();
			this.session().undo();
		} else if (
			(key === 'y' || (key === 'z' && event.shiftKey)) &&
			this.session().canRedo()
		) {
			event.preventDefault();
			this.session().redo();
		}
	}

	private runPublish(publish: () => Observable<ItemOf<T>>): void {
		this.settings.wasAttempted.set(true);
		if (this.publishProblem()) {
			this.pane.set('fields');
			afterNextRender(() => this.focusFirstError(), {
				injector: this.injector
			});
			return;
		}
		this.isPublishing.set(true);
		publish().subscribe({
			next: (item) => {
				this.isPublishing.set(false);
				this.notifier.notifySuccess(
					`Published ${itemName(item as object)}.`
				);
				this.publishedItem.emit(item);
			},
			error: (error: unknown) => {
				this.isPublishing.set(false);
				if (this.session().conflict()) {
					this.shell().scrollToTop();
					return;
				}
				this.notifier.notifyFailure(
					error instanceof Error && !('status' in error)
						? error.message
						: describeWriteError(error)
				);
			}
		});
	}

	/** Material leaves `aria-invalid` off empty required inputs: find the field. */
	private focusFirstError(): void {
		const field = this.host.nativeElement.querySelector<HTMLElement>(
			'.mat-form-field-invalid :is(input, textarea, .mat-mdc-select), [aria-invalid="true"]'
		);
		field?.focus();
	}
}
