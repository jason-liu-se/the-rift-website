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
import {
	EMPTY,
	Observable,
	catchError,
	filter,
	map,
	of,
	switchMap
} from 'rxjs';
import { EditorContentType } from 'src/app/interfaces/api-requests';
import { AdminNotifierService } from 'src/app/services/admin-notifier/admin-notifier.service';
import { ItemOf } from 'src/app/services/editor-content/editor-content-types';
import {
	BrowserStorage,
	STORAGE_KEYS
} from 'src/app/services/browser-storage/browser-storage.service';
import { EditorContentService } from 'src/app/services/editor-content/editor-content.service';
import { CollectionsStore } from '../../services/collections-store.service';
import { DraftFields } from '../../drafts/draft-fields';
import { DraftSession } from '../../drafts/draft-session';
import { DraftSessionsService } from '../../drafts/draft-sessions.service';
import { EDITOR_TYPES, toCollectionType } from '../../editor-types';
import { openModalRoute } from '../../utilities/modal-route';
import { describeWriteError } from '../../utilities/write-errors';
import {
	DraftEditorComponent,
	PublishedItemActions
} from '../draft-editor/draft-editor.component';
import {
	PublishSettings,
	providePublishSettings
} from '../draft-editor/publish-settings';
import { EditorListActions } from '../editor-list/editor-list.actions';
import { EditorListStore } from '../editor-list/editor-list.store';
import { itemName } from '../editor-list/item-name';

interface EditorTarget {
	id?: string;
	draftId?: string;
}

/**
 * The editor modal over a tool's list: a new item (`new`), a draft
 * (`drafts/<draftId>`), or a published item (`<id>`, resuming the editor's
 * draft of it). A new item's draft gets its own URL once it's saved, so a
 * reload reopens it.
 */
@Component({
	selector: 'app-editor-modal',
	templateUrl: './editor-modal.component.html',
	imports: [DraftEditorComponent, NgComponentOutlet],
	providers: [providePublishSettings()]
})
export class EditorModalComponent {
	private router = inject(Router);
	private route = inject(ActivatedRoute);
	private sessions = inject(DraftSessionsService);
	private editorContent = inject(EditorContentService);
	private notifier = inject(AdminNotifierService);
	private listStore = inject(EditorListStore);
	private listActions = inject(EditorListActions);
	private settings = inject(PublishSettings);
	private storage = inject(BrowserStorage);
	private collectionsStore = inject(CollectionsStore);
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
						? (this.config.publicPath as (i: object) => string)(item)
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
			.subscribe((session) => this.setSession(session));
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
		inject(DestroyRef).onDestroy(() => this.setSession(undefined));
	}

	protected finishPublishing(): void {
		const collection = (this.session()?.fields() as { collection?: string })
			.collection;
		if (collection) {
			this.storage.set('local', this.lastCollectionKey(), collection);
		}
		this.listStore.reload();
		this.close();
	}

	/**
	 * What a new item starts in: the collection the list shows, else the one
	 * last published to, else the first.
	 */
	private newItemFields(): DraftFields<EditorContentType> {
		const fields = this.config.newItemFields();
		const collectionType = toCollectionType(this.type);
		if (!collectionType) {
			return fields;
		}
		const slugs = (
			this.collectionsStore.collections(collectionType)() ?? []
		).map(({ slug }) => slug);
		const candidates = [
			this.listStore.filters().collection,
			this.storage.get('local', this.lastCollectionKey())
		];
		const collection =
			candidates.find((slug) => slug && slugs.includes(slug)) ?? slugs[0];
		return collection ? { ...fields, collection } : fields;
	}

	private lastCollectionKey(): string {
		return STORAGE_KEYS.lastCollectionPrefix + this.type;
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

	private open({
		id,
		draftId
	}: EditorTarget): Observable<DraftSession<EditorContentType>> {
		this.setSession(undefined);
		this.publishedItem.set(undefined);
		this.settings.reset(undefined);
		const opening = draftId
			? this.sessions
					.openDraft(this.type, draftId)
					.pipe(switchMap((session) => this.withPublished(session)))
			: id
				? this.fetchPublished(id).pipe(
						switchMap((item) =>
							this.sessions.startEdit(this.type, item)
						)
					)
				: of(this.sessions.startNew(this.type, this.newItemFields()));
		return opening.pipe(
			catchError((error: unknown) => {
				this.notifier.notifyFailure(
					`Couldn't open it. ${describeWriteError(error)}`
				);
				this.close();
				return EMPTY;
			})
		);
	}

	/** Fetches the published item, keeping its visibility and date. */
	private fetchPublished(id: string): Observable<ItemOf<EditorContentType>> {
		return this.editorContent.fetchItem(this.type, id).pipe(
			map((item) => {
				const { visible, date } = item as {
					visible: boolean;
					date?: string;
				};
				this.publishedItem.set(item);
				this.settings.reset({ visible, date });
				return item;
			})
		);
	}

	/** An edit draft's item's visibility and date (if it can be fetched). */
	private withPublished(
		session: DraftSession<EditorContentType>
	): Observable<DraftSession<EditorContentType>> {
		const targetId = session.targetId();
		return targetId
			? this.fetchPublished(targetId).pipe(
					map(() => session),
					catchError(() => of(session))
				)
			: of(session);
	}
}
