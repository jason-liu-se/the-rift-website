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
import {
	EditorContentType,
	NewsDraftOptions
} from 'src/app/core/api/api-requests';
import { AdminNotifier } from 'src/app/features/admin/admin-notifier';
import {
	ItemOf,
	fieldLabelsOf,
	requiredFieldsOf
} from 'src/app/features/admin/editor-content/editor-content-types';
import { DraftSession } from '../drafts/draft-session';
import { findMissingFields } from '../drafts/draft-fields';
import { UNPUBLISHED_CHANGES } from '../status-badge/status-badge';
import { DraftPublisher } from '../drafts/draft-publisher';
import { EDITOR_TYPES } from '../editor-type-configs';
import { itemName } from '../editor-list/item-name';
import { ModalShell } from '../modal-shell/modal-shell';
import { DraftFooter } from '../draft-footer/draft-footer';
import { DraftHistory } from '../draft-history/draft-history';
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
	]
})
export class DraftEditor<T extends EditorContentType> {
	private notifier = inject(AdminNotifier);
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
	protected readonly fieldLabels = computed(() =>
		fieldLabelsOf(this.session().type)
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
	/** News only: when it'll go live, as the draft says. */
	private readonly date = computed(() =>
		this.config().hasDate
			? (this.session().fields() as NewsDraftOptions).date
			: undefined
	);
	private readonly missingFields = computed(() =>
		findMissingFields(
			this.session().fields() as Record<string, unknown>,
			requiredFieldsOf(this.session().type)
		)
	);
	protected readonly publisher = new DraftPublisher<T>({
		session: this.session,
		noun: () => this.noun().one,
		isEdit: this.isEdit,
		wasAttempted: this.settings.wasAttempted,
		findProblem: () =>
			this.missingFields().length > 0
				? 'Fields marked * are required.'
				: findScheduleProblem(this.date()),
		nameOf: (item) => itemName(item as object),
		onProblem: () => {
			this.pane.set('fields');
			afterNextRender(() => this.focusFirstError(), {
				injector: this.injector
			});
		},
		onConflict: () => this.shell().scrollToTop(),
		onPublished: (item) => this.publishedItem.emit(item as ItemOf<T>),
		onDiscarded: () => this.closed.emit()
	});
	/** News only: it'll go live later. */
	protected readonly isScheduled = computed(
		() => toDateChoice(this.date(), this.isEdit()) === 'schedule'
	);

	protected close(): void {
		if (this.session().hasUnpublishedChanges()) {
			this.notifier.notifySuccess(
				`Your changes are kept. Find them under ${UNPUBLISHED_CHANGES}.`
			);
		}
		this.session().close();
		this.closed.emit();
	}

	/** Material leaves `aria-invalid` off empty required inputs: find the field. */
	private focusFirstError(): void {
		const field = this.host.nativeElement.querySelector<HTMLElement>(
			'.mat-form-field-invalid :is(input, textarea, .mat-mdc-select), [aria-invalid="true"]'
		);
		field?.focus();
	}
}
