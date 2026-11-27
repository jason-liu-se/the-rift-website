import { NgComponentOutlet } from '@angular/common';
import {
	Component,
	DestroyRef,
	TemplateRef,
	computed,
	inject,
	input,
	signal,
	viewChild
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, Observable, catchError, filter, switchMap } from 'rxjs';
import { EditorContentType } from 'src/app/core/api/api-requests';
import { AdminNotifier } from 'src/app/features/admin/admin-notifier';
import { ItemOf } from 'src/app/features/admin/editor-content/editor-content-types';
import { DraftSession } from '../drafts/draft-session';
import { DraftStore } from '../drafts/draft-store';
import { EDITOR_TYPES } from '../editor-type-configs';
import { openModalRoute } from '../modal-route';
import { describeWriteError } from '../write-errors';
import {
	DraftEditor,
	PublishedItemActions
} from '../draft-editor/draft-editor';
import {
	PublishSettings,
	providePublishSettings
} from '../draft-editor/publish-settings';
import {
	EditorSessionOpener,
	EditorTarget,
	OpenedEditor
} from './editor-session-opener';
import { EditorListActions } from '../editor-list/editor-list-actions';
import { EditorListStore } from '../editor-list/editor-list-store';
import { itemName } from '../editor-list/item-name';

/**
 * The editor modal over a tool's list: a new item (`new`), a draft
 * (`drafts/<draftId>`), or a published item (`<id>`, resuming the editor's
 * draft of it). A new item's draft gets its own URL once it's saved, so a
 * reload reopens it.
 */
@Component({
	selector: 'app-editor-modal',
	templateUrl: './editor-modal.html',
	imports: [DraftEditor, NgComponentOutlet],
	providers: [providePublishSettings(), EditorSessionOpener]
})
export class EditorModal {
	private router = inject(Router);
	private route = inject(ActivatedRoute);
	private opener = inject(EditorSessionOpener);
	private notifier = inject(AdminNotifier);
	private listStore = inject(EditorListStore);
	private listActions = inject(EditorListActions);
	private settings = inject(PublishSettings);
	private draftStore = inject(DraftStore);
	private content = viewChild.required<TemplateRef<unknown>>('content');

	/** From the URL. */
	public readonly id = input<string>();
	/** From the URL. */
	public readonly draftId = input<string>();

	protected readonly type = this.route.parent!.snapshot.paramMap.get(
		'type'
	) as EditorContentType;
	protected readonly config = EDITOR_TYPES[this.type];
	protected readonly session = signal<
		DraftSession<EditorContentType> | undefined
	>(undefined);
	private readonly publishedItem = signal<
		ItemOf<EditorContentType> | undefined
	>(undefined);
	protected readonly close = openModalRoute(() => this.content(), {
		wide: !!this.config.preview
	});
	/** The ⋮ menu's actions on the published item, when editing one. */
	protected readonly itemActions = computed<PublishedItemActions | undefined>(
		() => {
			const item = this.publishedItem();
			if (!item) {
				return undefined;
			}
			return {
				duplicate: () => this.listActions.duplicate(item),
				remove: () =>
					this.listActions
						.deleteItem(itemName(item), {
							id: item.id,
							startingRevision: item.revision
						})
						.subscribe((isDeleted) => {
							if (isDeleted) {
								this.discardSession();
								this.close();
							}
						}),
				publicPath:
					item.status === 'live'
						? (this.config.publicPath as (i: object) => string)(
								item
							)
						: undefined
			};
		}
	);

	private readonly target = computed<EditorTarget>(
		() => ({ id: this.id(), draftId: this.draftId() }),
		{ equal: (a, b) => a.id === b.id && a.draftId === b.draftId }
	);
	/** A new item's draft, once saved, while its URL is still `new`. */
	private readonly unlinkedDraftId = computed(() => {
		const session = this.session();
		const isSaved = session && session.status() !== 'unchanged';
		return isSaved && !session.isEdit() && !this.draftId()
			? session.id()
			: undefined;
	});

	constructor() {
		toObservable(this.target)
			.pipe(
				// Its own new draft getting a URL isn't a different item.
				filter(
					({ draftId }) =>
						!draftId || draftId !== this.session()?.id()
				),
				switchMap((target) => this.open(target)),
				takeUntilDestroyed()
			)
			.subscribe((opened) => this.show(opened));
		toObservable(this.unlinkedDraftId)
			.pipe(filter(Boolean), takeUntilDestroyed())
			.subscribe((draftId) =>
				this.router.navigate(['drafts', draftId], {
					relativeTo: this.route.parent,
					queryParamsHandling: 'preserve',
					replaceUrl: true,
					scroll: 'manual'
				})
			);
		inject(DestroyRef).onDestroy(() => {
			// Saved, changed, or discarded drafts change the list's drafts:
			// reload once closing has sent the waiting change.
			const status = this.session()?.status();
			this.setSession(undefined);
			if (status && status !== 'unchanged' && status !== 'published') {
				this.draftStore
					.afterWrites()
					.subscribe(() => this.listStore.reload());
			}
		});
	}

	protected finishPublishing(): void {
		const fields = this.session()?.fields() ?? {};
		this.opener.rememberCollection(this.type, fields);
		this.listStore.reload();
		this.close();
	}

	/** The item is gone: its draft (if any) goes with it, unsaved. */
	private discardSession(): void {
		this.session()?.discard().subscribe();
		this.session.set(undefined);
	}

	private setSession(
		session: DraftSession<EditorContentType> | undefined
	): void {
		this.session()?.close();
		this.session.set(session);
	}

	private open(target: EditorTarget): Observable<OpenedEditor> {
		this.setSession(undefined);
		this.publishedItem.set(undefined);
		this.settings.reset(undefined);
		return this.opener.open(this.type, target).pipe(
			catchError((error: unknown) => {
				this.notifier.notifyFailure(
					`Couldn't open it. ${describeWriteError(error)}`
				);
				this.close();
				return EMPTY;
			})
		);
	}

	private show({ session, published }: OpenedEditor): void {
		if (published) {
			this.publishedItem.set(published);
			this.settings.reset({
				date: (published as { date?: string }).date
			});
		}
		this.setSession(session);
	}
}
