import {
	DestroyRef,
	Injectable,
	computed,
	inject,
	signal
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
	EMPTY,
	Observable,
	Subject,
	catchError,
	filter,
	map,
	of,
	switchMap
} from 'rxjs';
import { CollectionDraftType } from 'src/app/interfaces/api-requests';
import {
	DraftSummary,
	EditorCollection
} from 'src/app/interfaces/api-responses';
import { AdminNotifierService } from 'src/app/services/admin-notifier/admin-notifier.service';
import { DraftsService } from 'src/app/services/drafts/drafts.service';
import {
	CollectionContentType,
	toCollectionDraftType
} from 'src/app/services/editor-content/editor-content-types';
import { DraftSession } from '../../drafts/draft-session';
import { DraftSessionsService } from '../../drafts/draft-sessions.service';
import { DraftStore } from '../../drafts/draft-store.service';
import { CollectionsStore } from '../../services/collections-store.service';
import { describeWriteError } from '../../utilities/write-errors';

export type CollectionSession = DraftSession<CollectionDraftType>;

/** A draft of a new collection, as the list names it. */
export interface NewCollectionDraft {
	id: string;
	fields: { title?: string; slug?: string };
}

/**
 * The Collections modal's editing: the one collection draft open in its form
 * (a new collection, or an edit of one), and the editor's collection drafts
 * to list. Renaming or showing a collection from the list changes its draft,
 * opening it. Provided by the modal (`start` with its type).
 */
@Injectable()
export class CollectionsEditor {
	private sessions = inject(DraftSessionsService);
	private drafts = inject(DraftsService);
	private draftStore = inject(DraftStore);
	private collectionsStore = inject(CollectionsStore);
	private notifier = inject(AdminNotifierService);

	private readonly type = signal<CollectionContentType>('gallery');
	private readonly draftType = computed<CollectionDraftType>(() =>
		toCollectionDraftType(this.type())
	);
	private readonly serverDrafts = signal<DraftSummary[]>([]);
	private readonly reloads = new Subject<void>();
	/** The draft open in the form. */
	public readonly session = signal<CollectionSession | undefined>(undefined);
	/** A collection was published, so the list's collection names may differ. */
	public readonly hasPublished = signal(false);

	/** The server's collection drafts, with this browser's waiting changes. */
	private readonly allDrafts = computed(() =>
		this.draftStore.withPending(this.serverDrafts(), this.draftType())
	);
	/**
	 * Drafts of new collections, most recently saved first, with the open one
	 * until the server lists it.
	 */
	public readonly newDrafts = computed<NewCollectionDraft[]>(() => {
		const listed = this.allDrafts().filter(
			({ target }) => !target
		) as NewCollectionDraft[];
		const session = this.session();
		const isUnlisted =
			!!session &&
			!session.isEdit() &&
			session.hasUnpublishedChanges() &&
			!listed.some(({ id }) => id === session.id());
		return isUnlisted
			? [{ id: session.id(), fields: session.fields() }, ...listed]
			: listed;
	});
	/** Each collection's edit draft, by its slug. */
	public readonly editDrafts = computed(
		() =>
			new Map(
				this.allDrafts().flatMap((draft) =>
					draft.target ? [[draft.target.id, draft] as const] : []
				)
			)
	);

	constructor() {
		this.reloads
			.pipe(
				switchMap(() =>
					this.drafts
						.fetchDrafts(this.draftType())
						.pipe(catchError(() => EMPTY))
				),
				takeUntilDestroyed()
			)
			.subscribe((drafts) => this.serverDrafts.set(drafts));
		// Once a new draft is first saved, list it from the server.
		toObservable(
			computed(() => {
				const session = this.session();
				return (
					session?.status() === 'saved' &&
					!session.isEdit() &&
					!this.serverDrafts().some(({ id }) => id === session.id())
				);
			})
		)
			.pipe(filter(Boolean), takeUntilDestroyed())
			.subscribe(() => this.reloadDrafts());
		inject(DestroyRef).onDestroy(() => this.close());
	}

	/** Lists the type's drafts, with a new collection open in the form. */
	public start(type: CollectionContentType): void {
		this.type.set(type);
		this.reloadDrafts();
		this.startNew();
	}

	public startNew(): void {
		this.setSession(this.sessions.startNew(this.draftType()));
	}

	/**
	 * Opens the collection, carrying on with its draft if there is one.
	 * Emits once it's open.
	 */
	public edit(collection: EditorCollection): Observable<unknown> {
		return this.sessionOf(collection);
	}

	/** Opens a draft of a new collection. Emits once it's open. */
	public openDraft(id: string): Observable<unknown> {
		return this.sessions.openDraft(this.draftType(), id).pipe(
			map((session) => this.setSession(session)),
			catchError((error: unknown) => this.notifyOpenFailure(error))
		);
	}

	/** Renames the collection in its draft, opening it. */
	public rename(collection: EditorCollection, title: string): void {
		this.sessionOf(collection).subscribe((session) =>
			session.update({ title })
		);
	}

	/** Shows or hides the collection in its draft, opening it. */
	public toggleVisibility(collection: EditorCollection): void {
		this.sessionOf(collection).subscribe((session) =>
			session.update({ visible: !(session.fields().visible ?? true) })
		);
	}

	/** The open draft was published: back to a new collection. */
	public notePublished(): void {
		this.hasPublished.set(true);
		this.collectionsStore.reload(this.type());
		this.startNew();
	}

	/** The open draft was discarded: back to a new collection. */
	public noteDiscarded(): void {
		this.startNew();
	}

	/** The collection was deleted: its draft goes too. */
	public noteDeleted(slug: string): void {
		const session = this.session();
		const draft = this.editDrafts().get(slug);
		if (session?.targetId() === slug) {
			session.discard().subscribe({ error: () => undefined });
			this.startNew();
		} else if (draft) {
			this.draftStore
				.delete(draft.id)
				.subscribe({ complete: () => this.reloadDrafts() });
		}
	}

	/** The collection's open draft, opening it first if another is open. */
	private sessionOf(
		collection: EditorCollection
	): Observable<CollectionSession> {
		const open = this.session();
		if (open?.targetId() === collection.slug) {
			return of(open);
		}
		return this.sessions.startEdit(this.draftType(), collection).pipe(
			map((session) => {
				this.setSession(session);
				return session;
			}),
			catchError((error: unknown) => this.notifyOpenFailure(error))
		);
	}

	/**
	 * Closes the open draft for the next, listing it again once its waiting
	 * change is sent.
	 */
	private setSession(session: CollectionSession): void {
		const previous = this.session();
		previous?.close();
		this.session.set(session);
		if (previous && previous.status() !== 'unchanged') {
			this.draftStore.afterWrites().subscribe(() => this.reloadDrafts());
		}
	}

	private reloadDrafts(): void {
		this.reloads.next();
	}

	private notifyOpenFailure(error: unknown): Observable<never> {
		this.notifier.notifyFailure(
			`Couldn't open it. ${describeWriteError(error)}`
		);
		return EMPTY;
	}

	private close(): void {
		const session = this.session();
		if (session?.hasUnpublishedChanges()) {
			this.notifier.notifySuccess(
				'Your changes are kept. Find them in Collections.'
			);
		}
		session?.close();
	}
}
