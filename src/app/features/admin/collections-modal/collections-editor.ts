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
	of,
	switchMap,
	tap
} from 'rxjs';
import { CollectionDraftType } from 'src/app/core/api/api-requests';
import { DraftSummary, EditorCollection } from 'src/app/core/api/api-responses';
import { AdminNotifier } from 'src/app/features/admin/admin-notifier';
import { DraftsApi } from 'src/app/features/admin/drafts/drafts-api';
import {
	CollectionContentType,
	toCollectionDraftType
} from 'src/app/features/admin/editor-content/editor-content-types';
import { DraftSession } from '../drafts/draft-session';
import { DraftSessions } from '../drafts/draft-sessions';
import { DraftStore } from '../drafts/draft-store';
import { CollectionsStore } from '../collections-store';
import { describeWriteError } from '../write-errors';

export type CollectionSession = DraftSession<CollectionDraftType>;

/** A published collection, or a new collection's draft by its ID. */
export type CollectionTarget = EditorCollection | string;

/** A draft of a new collection, as the list names it. */
export interface NewCollectionDraft {
	id: string;
	fields: { title?: string; slug?: string; visible?: boolean };
	dimensionCount?: number;
}

/**
 * The Collections modal's editing: the one collection draft open in its form
 * (a new collection, or an edit of one), and the editor's collection drafts
 * to list. Showing or hiding one from the list changes its draft, opening
 * it. Provided by the modal (`start` with its type).
 */
@Injectable()
export class CollectionsEditor {
	private sessions = inject(DraftSessions);
	private drafts = inject(DraftsApi);
	private draftStore = inject(DraftStore);
	private collectionsStore = inject(CollectionsStore);
	private notifier = inject(AdminNotifier);

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
	 * Opens a published collection (carrying on with its draft if there is
	 * one) or a new one's draft, by ID. Emits once it's open.
	 */
	public open(target: CollectionTarget): Observable<unknown> {
		return this.sessionOf(target);
	}

	/** Shows or hides the collection in its draft, opening it. */
	public toggleVisibility(target: CollectionTarget): void {
		this.sessionOf(target).subscribe((session) =>
			session.update({ visible: !(session.fields().visible ?? true) })
		);
	}

	/** Deletes a new collection's draft. */
	public discardNewDraft(id: string): Observable<unknown> {
		const session = this.session();
		if (session?.id() === id) {
			return session.discard().pipe(tap(() => this.startNew()));
		}
		return this.draftStore.delete(id).pipe(tap(() => this.reloadDrafts()));
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

	/** The open draft of the target, opening it first if another is open. */
	private sessionOf(target: CollectionTarget): Observable<CollectionSession> {
		const open = this.session();
		const isDraftId = typeof target === 'string';
		if (
			open &&
			(isDraftId ? open.id() === target : open.targetId() === target.slug)
		) {
			return of(open);
		}
		const opening = isDraftId
			? this.sessions.openDraft(this.draftType(), target)
			: this.sessions.startEdit(this.draftType(), target);
		return opening.pipe(
			tap((session) => this.setSession(session)),
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
