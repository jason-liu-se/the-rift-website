import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Signal, computed, signal } from '@angular/core';
import {
	EMPTY,
	Observable,
	Subject,
	Subscription,
	catchError,
	concatMap,
	debounceTime,
	defer,
	map,
	of,
	switchMap,
	tap,
	throwError
} from 'rxjs';
import { AUTOSAVE_DELAY_MS, UNDO_GROUP_MS } from 'src/app/config/admin';
import {
	DraftContent,
	DraftPublishRequest,
	DraftSaveRequest,
	DraftTarget,
	EditorContentType
} from 'src/app/interfaces/api-requests';
import { ConflictResponse, Draft } from 'src/app/interfaces/api-responses';
import { ApiStatus } from 'src/app/services/api-status/api-status.service';
import { DraftsService } from 'src/app/services/drafts/drafts.service';
import { LocalDraftsService } from 'src/app/services/drafts/local-drafts.service';
import { ItemOf } from 'src/app/services/editor-content/editor-content-types';
import {
	DraftFields,
	isEmptyDraft,
	isSameFields,
	pickFields
} from './draft-fields';

/**
 * Where the draft is saved:
 * - `unchanged`: nothing to save (nothing changed, or it would be empty)
 * - `local`: saved in this browser, waiting for the server (offline, or
 *   until typing pauses)
 * - `saving`, `saved`, `failed`: the server's copy
 * - `conflict`: the server refused a save or publish; see `conflict`
 * - `published`: done
 */
export type AutosaveStatus =
	| 'unchanged'
	| 'local'
	| 'saving'
	| 'saved'
	| 'failed'
	| 'conflict'
	| 'published';

/**
 * Why the server refused:
 * - `draft`: another device saved this draft since, or an edit draft of the
 *   same item exists (`theirs`); keep mine or theirs
 * - `item`: the item changed since the draft started (`theirs`); merge or
 *   overwrite
 * - `deleted`: the item was deleted; publish as new or discard
 */
export type DraftConflict<T extends EditorContentType> =
	| { kind: 'draft'; theirs: Draft }
	| { kind: 'item'; theirs: ItemOf<T> }
	| { kind: 'deleted' };

/** How an editing session starts. */
export interface DraftSessionStart<T extends EditorContentType> {
	type: T;
	/** The editor (Discord user ID), whose drafts these are. */
	owner: string;
	/** An existing draft's ID; a new draft gets one. */
	id?: string;
	fields: DraftFields<T>;
	/** What "no changes" means: the published item's fields, or the draft's. */
	baseline: DraftFields<T>;
	/** The published item an edit draft started from. */
	target?: DraftTarget;
	/** The server's revision of an existing draft. */
	revision?: number;
	/** The fields have changes the server hasn't saved (a local copy). */
	isPending?: boolean;
}

/** What a session needs from outside, passed in so it can be tested alone. */
export interface DraftSessionDeps {
	drafts: DraftsService;
	localDrafts: LocalDraftsService;
	apiStatus: Signal<ApiStatus>;
	createId: () => string;
}

/**
 * One editing session of an item or draft: its fields, autosaved to this
 * browser as they change and to the server once typing pauses (only once
 * something changed, and never an empty draft); undo and redo within the
 * session; conflicts; and publishing. Call `close()` when done.
 */
export class DraftSession<T extends EditorContentType> {
	public readonly type: T;
	private readonly owner: string;
	private readonly baseline = signal<DraftFields<T>>({});
	private readonly draftId: ReturnType<typeof signal<string>>;
	private readonly savedFields = signal<DraftFields<T>>({});
	private target?: DraftTarget;
	private revision?: number;
	private isPending: boolean;
	private undoStack: DraftFields<T>[] = [];
	private redoStack: DraftFields<T>[] = [];
	private lastChange = { keys: '', at: 0 };
	private readonly historySize = signal({ undo: 0, redo: 0 });
	private readonly saveRequests = new Subject<void>();
	private readonly autosave: Subscription;

	public readonly fields: ReturnType<typeof signal<DraftFields<T>>>;
	public readonly status = signal<AutosaveStatus>('unchanged');
	public readonly conflict = signal<DraftConflict<T> | undefined>(undefined);
	/** Their version of the item, beside the editor's, while merging. */
	public readonly mergeReference = signal<DraftFields<T> | undefined>(
		undefined
	);
	/** The draft's ID, which is also the new item's createId. */
	public readonly id: Signal<string>;
	/** Something differs from the published item (or the draft as opened). */
	public readonly hasChanges = computed(
		() => !isSameFields(this.fields(), this.baseline())
	);
	public readonly canUndo = computed(() => this.historySize().undo > 0);
	public readonly canRedo = computed(() => this.historySize().redo > 0);
	/** Editing a published item (rather than a new one). */
	public readonly isEdit: Signal<boolean>;
	private readonly isEditSignal = signal(false);

	constructor(
		start: DraftSessionStart<T>,
		private readonly deps: DraftSessionDeps
	) {
		this.type = start.type;
		this.owner = start.owner;
		this.fields = signal(start.fields);
		this.baseline.set(start.baseline);
		this.savedFields.set(start.isPending ? {} : start.fields);
		this.draftId = signal(start.id ?? deps.createId());
		this.id = this.draftId.asReadonly();
		this.target = start.target;
		this.isEditSignal.set(!!start.target);
		this.isEdit = this.isEditSignal.asReadonly();
		this.revision = start.revision;
		this.isPending = !!start.isPending;
		if (start.revision !== undefined) {
			this.status.set(this.isPending ? 'local' : 'saved');
		}
		this.autosave = this.saveRequests
			.pipe(
				debounceTime(AUTOSAVE_DELAY_MS),
				concatMap(() =>
					this.saveToServer().pipe(catchError(() => EMPTY))
				)
			)
			.subscribe();
		if (this.isPending) {
			this.saveRequests.next();
		}
	}

	/** Changes some fields: saved here at once, and to the server on a pause. */
	public update(changes: DraftFields<T>): void {
		const keys = Object.keys(changes).sort().join();
		const now = Date.now();
		const isSameStep =
			keys === this.lastChange.keys &&
			now - this.lastChange.at < UNDO_GROUP_MS;
		if (!isSameStep) {
			this.undoStack.push(this.fields());
			this.redoStack = [];
		}
		this.lastChange = { keys, at: now };
		this.setFields({ ...this.fields(), ...changes });
	}

	public undo(): void {
		const previous = this.undoStack.pop();
		if (previous) {
			this.redoStack.push(this.fields());
			this.lastChange = { keys: '', at: 0 };
			this.setFields(previous);
		}
	}

	public redo(): void {
		const next = this.redoStack.pop();
		if (next) {
			this.undoStack.push(this.fields());
			this.lastChange = { keys: '', at: 0 };
			this.setFields(next);
		}
	}

	/** Saves to the server now: a retry, or the API is back. */
	public saveNow(): Observable<void> {
		return this.saveToServer();
	}

	/** Keeps mine (saved over theirs) or theirs (replacing mine). */
	public resolveDraftConflict(keep: 'mine' | 'theirs'): Observable<void> {
		const conflict = this.conflict();
		if (conflict?.kind !== 'draft') {
			return EMPTY;
		}
		const { theirs } = conflict;
		this.conflict.set(undefined);
		this.switchToDraft(theirs.id);
		this.revision = theirs.revision;
		this.target = theirs.target ?? this.target;
		if (keep === 'theirs') {
			const fields = pickFields(this.type, theirs.fields);
			this.fields.set(fields);
			this.savedFields.set(fields);
			this.isPending = false;
			this.status.set('saved');
			this.saveLocally();
			return of(undefined);
		}
		this.isPending = true;
		return this.saveToServer();
	}

	/**
	 * The item changed since the draft started. Both ways move the draft onto
	 * the item as it is now (a new draft, since a deleted draft's ID can't be
	 * reused): `overwrite` keeps the editor's fields to publish again;
	 * `merge` also shows their version beside the editor's to merge by hand.
	 */
	public resolveItemConflict(how: 'overwrite' | 'merge'): Observable<void> {
		const conflict = this.conflict();
		if (conflict?.kind !== 'item') {
			return EMPTY;
		}
		const { theirs } = conflict;
		this.conflict.set(undefined);
		if (how === 'merge') {
			this.mergeReference.set(pickFields(this.type, theirs));
		}
		this.baseline.set(pickFields(this.type, theirs));
		this.target = { id: theirs.id, startingRevision: theirs.revision };
		return this.moveToNewDraft();
	}

	/**
	 * Publishes the draft, saving it first. A refusal sets `conflict` (and
	 * still errors, so the caller can stop).
	 */
	public publish(options: DraftPublishRequest): Observable<ItemOf<T>> {
		return defer(() => {
			if (this.deps.apiStatus() !== 'up') {
				return throwError(
					() =>
						new Error(
							'Publishing needs the server. Try again once it can be reached.'
						)
				);
			}
			const save =
				this.isPending || this.revision === undefined
					? this.saveToServer()
					: of(undefined);
			return save.pipe(
				switchMap(() => {
					if (this.conflict()) {
						return throwError(
							() => new Error('Resolve the conflict first.')
						);
					}
					return this.deps.drafts.publishDraft<T>(this.id(), options);
				}),
				tap(() => {
					this.deps.localDrafts.remove(this.id());
					this.status.set('published');
					this.close();
				}),
				catchError((error: unknown) => this.toPublishConflict(error))
			);
		});
	}

	/** The item was deleted: publishes the edit as a new item instead. */
	public publishAsNew(options: DraftPublishRequest): Observable<ItemOf<T>> {
		this.conflict.set(undefined);
		return this.publish({ ...options, asNew: true });
	}

	/** Deletes the draft here and on the server. */
	public discard(): Observable<void> {
		this.close();
		this.deps.localDrafts.remove(this.id());
		return this.revision === undefined
			? of(undefined)
			: this.deps.drafts.deleteDraft(this.id());
	}

	/** The published item an edit draft is of. */
	public targetId(): string | undefined {
		return this.target?.id;
	}

	/** Stops autosaving; a pending change stays in this browser to sync later. */
	public close(): void {
		this.autosave.unsubscribe();
	}

	private setFields(fields: DraftFields<T>): void {
		this.fields.set(fields);
		this.historySize.set({
			undo: this.undoStack.length,
			redo: this.redoStack.length
		});
		if (!this.isWorthKeeping()) {
			this.status.set('unchanged');
			return;
		}
		this.isPending = !isSameFields(fields, this.savedFields());
		this.saveLocally();
		if (this.isPending) {
			this.status.set('local');
			this.saveRequests.next();
		}
	}

	/** No empty drafts, and none of an item until something changed. */
	private isWorthKeeping(): boolean {
		return (
			this.revision !== undefined ||
			(this.hasChanges() && !isEmptyDraft(this.fields()))
		);
	}

	private saveLocally(): void {
		this.deps.localDrafts.save({
			...this.content(),
			id: this.id(),
			owner: this.owner,
			target: this.target,
			revision: this.revision,
			isPending: this.isPending,
			updatedAt: new Date().toISOString()
		});
	}

	private content(): DraftContent {
		return { type: this.type, fields: this.fields() } as DraftContent;
	}

	private saveToServer(): Observable<void> {
		return defer(() => {
			if (!this.isPending || !this.isWorthKeeping() || this.conflict()) {
				return of(undefined);
			}
			if (this.deps.apiStatus() !== 'up') {
				this.status.set('local');
				return of(undefined);
			}
			const sent = this.fields();
			const request: DraftSaveRequest = {
				...this.content(),
				...(this.revision === undefined
					? { target: this.target }
					: { startingRevision: this.revision })
			};
			this.status.set('saving');
			return this.deps.drafts.saveDraft(this.id(), request).pipe(
				map((draft) => {
					this.revision = draft.revision;
					this.savedFields.set(sent);
					this.isPending = !isSameFields(this.fields(), sent);
					this.status.set(this.isPending ? 'local' : 'saved');
					this.saveLocally();
					if (this.isPending) {
						this.saveRequests.next();
					}
				}),
				catchError((error: unknown) => this.handleSaveError(error))
			);
		});
	}

	private handleSaveError(error: unknown): Observable<void> {
		const status = error instanceof HttpErrorResponse ? error.status : 0;
		if (status === HttpStatusCode.Conflict) {
			const theirs = (error as HttpErrorResponse).error as
				ConflictResponse<Draft> | undefined;
			if (theirs?.current) {
				this.conflict.set({ kind: 'draft', theirs: theirs.current });
				this.status.set('conflict');
				return of(undefined);
			}
		}
		if (status === HttpStatusCode.NotFound && this.revision !== undefined) {
			// Deleted elsewhere: keep the work as a new draft.
			return this.moveToNewDraft();
		}
		this.status.set('failed');
		return throwError(() => error);
	}

	/** Carries the fields over to a new draft, deleting the old one. */
	private moveToNewDraft(): Observable<void> {
		const oldId = this.id();
		const hadServerCopy = this.revision !== undefined;
		this.deps.localDrafts.remove(oldId);
		this.draftId.set(this.deps.createId());
		this.revision = undefined;
		this.isPending = true;
		this.saveLocally();
		if (hadServerCopy) {
			this.deps.drafts
				.deleteDraft(oldId)
				.pipe(catchError(() => EMPTY))
				.subscribe();
		}
		return this.saveToServer();
	}

	private switchToDraft(id: string): void {
		if (id !== this.id()) {
			this.deps.localDrafts.remove(this.id());
			this.draftId.set(id);
		}
	}

	private toPublishConflict(error: unknown): Observable<never> {
		if (error instanceof HttpErrorResponse) {
			const theirs = (error.error as ConflictResponse<ItemOf<T>> | null)
				?.current;
			if (error.status === HttpStatusCode.Conflict && theirs) {
				this.conflict.set({ kind: 'item', theirs });
				this.status.set('conflict');
			} else if (
				error.status === HttpStatusCode.NotFound &&
				this.target
			) {
				this.conflict.set({ kind: 'deleted' });
				this.status.set('conflict');
			}
		}
		return throwError(() => error);
	}
}
