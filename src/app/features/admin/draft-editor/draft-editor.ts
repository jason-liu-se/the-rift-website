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
import { MatIconButton } from '@angular/material/button';
import {
	MatButtonToggle,
	MatButtonToggleGroup
} from '@angular/material/button-toggle';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { Observable, filter } from 'rxjs';
import {
	EditorContentType,
	NewsDraftOptions
} from 'src/app/core/api/api-requests';
import { AdminNotifier } from 'src/app/features/admin/admin-notifier';
import { ItemOf } from 'src/app/features/admin/editor-content/editor-content-types';
import { DraftSession } from '../drafts/draft-session';
import { findMissingFields } from '../drafts/draft-fields';
import { discardDraft } from '../drafts/discard-draft';
import { EDITOR_TYPES } from '../editor-type-configs';
import { EditorWriter } from '../editor-writer';
import { describeWriteError } from '../write-errors';
import { itemName } from '../editor-list/item-name';
import { ModalShell } from '../modal-shell/modal-shell';
import { DraftFooter } from '../draft-footer/draft-footer';
import {
	DraftHistory,
	handleHistoryShortcut
} from '../draft-history/draft-history';
import { DraftConflict } from './draft-conflict/draft-conflict';
import {
	PublishSettings,
	findScheduleProblem,
	toDateChoice
} from './publish-settings';

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
	templateUrl: './draft-editor.html',
	styleUrl: './draft-editor.scss',
	imports: [
		DraftConflict,
		FormsModule,
		MatButtonToggle,
		MatButtonToggleGroup,
		MatIcon,
		MatIconButton,
		MatMenu,
		MatMenuItem,
		MatMenuTrigger,
		MatTooltip,
		ModalShell,
		NgComponentOutlet,
		DraftFooter,
		DraftHistory
	],
	host: {
		'(keydown)': 'handleShortcuts($event)'
	}
})
export class DraftEditor<T extends EditorContentType> {
	private notifier = inject(AdminNotifier);
	private writer = inject(EditorWriter);
	private injector = inject(Injector);
	private host = inject<ElementRef<HTMLElement>>(ElementRef);
	private shell = viewChild.required(ModalShell);

	public readonly session = input.required<DraftSession<T>>();
	/** The published item's actions, when editing one. */
	public readonly itemActions = input<PublishedItemActions>();

	public readonly publishedItem = output<ItemOf<T>>();
	public readonly closed = output<void>();

	protected readonly settings = inject(PublishSettings);
	private readonly config = computed(() => EDITOR_TYPES[this.session().type]);
	protected readonly noun = computed(() => this.config().noun);
	protected readonly fieldLabels = computed(
		() => this.config().fieldLabels as Record<string, string>
	);
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
	protected readonly isPublishing = signal(false);
	/** News only: when it'll go live, as the draft says. */
	private readonly date = computed(() =>
		this.config().hasDate
			? (this.session().fields() as NewsDraftOptions).date
			: undefined
	);
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
		return findScheduleProblem(this.date());
	});
	/** News only: it'll go live later. */
	protected readonly isScheduled = computed(
		() => toDateChoice(this.date(), this.isEdit()) === 'schedule'
	);

	protected publish(): void {
		this.runPublish(() =>
			// The draft holds the choices (visibility, a news date).
			this.session().publish({})
		);
	}

	protected publishAsNew(): void {
		this.runPublish(() => this.session().publishAsNew({}));
	}

	protected overwrite(): void {
		this.session()
			.resolveItemConflict('overwrite')
			.subscribe({ complete: () => this.publish() });
	}

	/** The conflict's way out when the item was deleted. */
	protected discard(): void {
		discardDraft(
			this.writer,
			this.session(),
			this.noun().one,
			this.isEdit()
		)
			.pipe(filter(Boolean))
			.subscribe(() => this.closed.emit());
	}

	protected close(): void {
		if (this.session().hasUnpublishedChanges()) {
			this.notifier.notifySuccess(
				'Your changes are kept. Find them under Unpublished changes.'
			);
		}
		this.session().close();
		this.closed.emit();
	}

	protected handleShortcuts(event: KeyboardEvent): void {
		handleHistoryShortcut(event, this.session());
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
