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
import { AUTOSAVE_DELAY_MS, UNDO_GROUP_MS } from 'src/app/core/config/admin';
import {
	DraftContent,
	DraftPublishRequest,
	DraftTarget,
	DraftType
} from 'src/app/core/api/api-requests';
import { ConflictResponse, Draft } from 'src/app/core/api/api-responses';
import { ApiStatus } from 'src/app/core/api/api-status/api-status.service';
import { DraftsService } from 'src/app/features/admin/drafts/drafts.service';
import {
	DraftItemOf,
	toTargetId
} from 'src/app/features/admin/editor-content/editor-content-types';
import {
	DraftFields,
	isEmptyDraft,
	isSameFields,
	pickDraftFields,
	pickItemFields
} from './draft-fields';
import { DraftStore } from './draft-store.service';

/**
 * Why the server refused:
 * - `draft`: another device saved this draft since, or an edit draft of the
 *   same item exists (`theirs`); keep mine or theirs
 * - `item`: the item changed since the draft started (`theirs`); merge or
 *   overwrite
 * - `deleted`: the item was deleted; publish as new or discard
 */
export type SaveConflict<T extends DraftType> =
	| { kind: 'draft'; theirs: Draft }
	| { kind: 'item'; theirs: DraftItemOf<T> }
	| { kind: 'deleted' };

/** Where the draft's changes are. */
export type SaveState<T extends DraftType> =
	/** Nothing to save: nothing changed, or it would be empty. */
	| { stage: 'unchanged' }
	/** In this browser, waiting for the server (offline, or for a pause). */
	| { stage: 'local' }
	| { stage: 'saving' }
	| { stage: 'saved' }
	| { stage: 'failed' }
	/** The server refused a save or publish. */
	| { stage: 'conflict'; conflict: SaveConflict<T> }
	| { stage: 'published' };

export type SaveStage = SaveState<DraftType>['stage'];

/** How an editing session starts. */
export interface DraftSessionStart<T extends DraftType> {
	type: T;
	/** An existing draft's ID; a new draft gets one. */
	id?: string;
	fields: DraftFields<T>;
	/** What "no changes" means: the published item's fields, or the draft's. */
	baseline: DraftFields<T>;
	/** What the server has, if it has the draft. */
	savedFields?: DraftFields<T>;
	/** The published item an edit draft started from. */
	target?: DraftTarget;
}

/** What a session needs from outside, passed in so it can be tested alone. */
export interface DraftSessionDeps {
	drafts: DraftsService;
	store: DraftStore;
	apiStatus: Signal<ApiStatus>;
	createId: () => string;
}

/**
 * One editing session of an item or draft: its fields (kept in this browser
 * as they change, and saved through `DraftStore` once typing pauses; never
 * an empty draft, or one of an item before something changed), undo and redo
 * within the session, conflicts, and publishing. Call `close()` when done.
 */
export class DraftSession<T extends DraftType> {
	private readonly baseline = signal<DraftFields<T>>({});
	private readonly savedFields = signal<DraftFields<T>>({});
	private readonly draftId: ReturnType<typeof signal<string>>;
	private readonly isEditSignal = signal(false);
	private readonly state = signal<SaveState<T>>({ stage: 'unchanged' });
	private readonly historySize = signal({ undo: 0, redo: 0 });
	private readonly saveRequests = new Subject<void>();
	private readonly autosave: Subscription;
	private target?: DraftTarget;
	private undoStack: DraftFields<T>[] = [];
	private redoStack: DraftFields<T>[] = [];
	private lastChange = { keys: '', at: 0 };

	public readonly type: T;
	public readonly fields: ReturnType<typeof signal<DraftFields<T>>>;
	/** Their version of the item, beside the editor's, while merging. */
	public readonly mergeReference = signal<DraftFields<T> | undefined>(
		undefined
	);
	/** The draft's ID, which is also the new item's createId. */
	public readonly id: Signal<string>;
	/** Editing a published item (rather than a new one). */
	public readonly isEdit = this.isEditSignal.asReadonly();

	/** The save stage; `local` turns `saved` once the store has sent it. */
	public readonly status = computed<SaveStage>(() => {
		const { stage } = this.state();
		return stage === 'local' && !this.deps.store.isPending(this.id())
			? 'saved'
			: stage;
	});
	public readonly conflict = computed(() => {
		const state = this.state();
		return state.stage === 'conflict' ? state.conflict : undefined;
	});
	/** Something differs from the published item (or the draft as opened). */
	public readonly hasChanges = computed(
		() => !isSameFields(this.fields(), this.baseline())
	);
	/**
	 * Changes the published item doesn't have yet, kept in a draft (`unchanged`
	 * means no draft, e.g. a new item with only its visibility set).
	 */
	public readonly hasUnpublishedChanges = computed(
		() =>
			this.hasChanges() &&
			this.status() !== 'published' &&
			this.status() !== 'unchanged'
	);
	public readonly canUndo = computed(() => this.historySize().undo > 0);
	public readonly canRedo = computed(() => this.historySize().redo > 0);

	constructor(
		start: DraftSessionStart<T>,
		private readonly deps: DraftSessionDeps
	) {
		this.type = start.type;
		this.fields = signal(start.fields);
		this.baseline.set(start.baseline);
		this.savedFields.set(start.savedFields ?? {});
		this.draftId = signal(start.id ?? deps.createId());
		this.id = this.draftId.asReadonly();
		this.target = start.target;
		this.isEditSignal.set(!!start.target);
		this.autosave = this.saveRequests
			.pipe(
				debounceTime(AUTOSAVE_DELAY_MS),
				concatMap(() => this.save().pipe(catchError(() => EMPTY)))
			)
			.subscribe();
		if (deps.store.isPending(this.id())) {
			this.state.set({ stage: 'local' });
			this.saveRequests.next();
		} else if (start.savedFields) {
			this.state.set({ stage: 'saved' });
		}
	}

	/** Changes some fields: kept here at once, saved to the server on a pause. */
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

	/** Saves to the server now (a retry). */
	public saveNow(): Observable<void> {
		return this.save();
	}

	/** Keeps mine (saved over theirs) or theirs (replacing mine). */
	public resolveDraftConflict(keep: 'mine' | 'theirs'): Observable<void> {
		const conflict = this.conflict();
		if (conflict?.kind !== 'draft') {
			return EMPTY;
		}
		const { theirs } = conflict;
		this.state.set({ stage: 'local' });
		if (theirs.id !== this.id()) {
			this.deps.store.forget(this.id());
			this.draftId.set(theirs.id);
		}
		this.deps.store.noteRevision(theirs.id, theirs.revision);
		this.target = theirs.target ?? this.target;
		const theirFields = pickDraftFields(this.type, theirs.fields);
		this.savedFields.set(theirFields);
		if (keep === 'theirs') {
			this.fields.set(theirFields);
			this.deps.store.dropCopy(this.id());
			this.state.set({ stage: 'saved' });
			return of(undefined);
		}
		this.keepLocally();
		return this.save();
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
		if (how === 'merge') {
			this.mergeReference.set(pickItemFields(this.type, theirs));
		}
		this.baseline.set(pickItemFields(this.type, theirs));
		this.target = {
			id: toTargetId(theirs),
			startingRevision: theirs.revision
		};
		return this.moveToNewDraft();
	}

	/**
	 * Publishes the draft, making sure the server has it first (even an edit
	 * with nothing changed). A refusal sets `conflict` (and still errors, so
	 * the caller can stop).
	 */
	public publish(options: DraftPublishRequest): Observable<DraftItemOf<T>> {
		return defer(() => {
			if (this.deps.apiStatus() !== 'up') {
				return throwError(
					() =>
						new Error(
							'Publishing needs the server. Try again once it can be reached.'
						)
				);
			}
			if (this.deps.store.revisionOf(this.id()) === undefined) {
				this.keepLocally();
			}
			return this.save().pipe(
				switchMap(() => {
					if (this.conflict()) {
						return throwError(
							() => new Error('Resolve the conflict first.')
						);
					}
					return this.deps.drafts.publishDraft<T>(this.id(), options);
				}),
				tap(() => {
					this.deps.store.forget(this.id());
					this.state.set({ stage: 'published' });
					this.autosave.unsubscribe();
				}),
				catchError((error: unknown) => this.toPublishConflict(error))
			);
		});
	}

	/** The item was deleted: publishes the edit as a new item instead. */
	public publishAsNew(
		options: DraftPublishRequest
	): Observable<DraftItemOf<T>> {
		this.state.set({ stage: 'local' });
		return this.publish({ ...options, asNew: true });
	}

	/** Deletes the draft here and on the server. */
	public discard(): Observable<void> {
		this.autosave.unsubscribe();
		const id = this.id();
		if (this.deps.store.revisionOf(id) === undefined) {
			this.deps.store.forget(id);
			return of(undefined);
		}
		return this.deps.store.delete(id);
	}

	/** The published item an edit draft is of. */
	public targetId(): string | undefined {
		return this.target?.id;
	}

	/**
	 * Stops autosaving, sending a waiting change now (if the server can be
	 * reached; otherwise it stays in this browser to sync later).
	 */
	public close(): void {
		this.autosave.unsubscribe();
		const id = this.id();
		if (
			this.deps.store.isPending(id) &&
			!this.conflict() &&
			this.deps.apiStatus() === 'up'
		) {
			this.deps.store.send(id).subscribe({ error: () => undefined });
		}
	}

	private setFields(fields: DraftFields<T>): void {
		this.fields.set(fields);
		this.historySize.set({
			undo: this.undoStack.length,
			redo: this.redoStack.length
		});
		if (!this.isWorthKeeping()) {
			this.deps.store.dropCopy(this.id());
			this.state.set({ stage: 'unchanged' });
			return;
		}
		if (isSameFields(fields, this.savedFields())) {
			// Back to what the server has: nothing to send.
			this.deps.store.dropCopy(this.id());
			this.state.set({ stage: 'saved' });
			return;
		}
		this.keepLocally();
		this.saveRequests.next();
	}

	/** No empty drafts, and none of an item until something changed. */
	private isWorthKeeping(): boolean {
		return (
			this.deps.store.revisionOf(this.id()) !== undefined ||
			(this.hasChanges() && !isEmptyDraft(this.fields()))
		);
	}

	private keepLocally(): void {
		this.deps.store.keep({
			...({ type: this.type, fields: this.fields() } as DraftContent),
			id: this.id(),
			target: this.target
		});
		if (!this.conflict()) {
			this.state.set({ stage: 'local' });
		}
	}

	private save(): Observable<void> {
		return defer(() => {
			if (!this.deps.store.isPending(this.id()) || this.conflict()) {
				return of(undefined);
			}
			if (this.deps.apiStatus() !== 'up') {
				this.state.set({ stage: 'local' });
				return of(undefined);
			}
			this.state.set({ stage: 'saving' });
			return this.deps.store.send(this.id()).pipe(
				map((saved) => {
					if (saved) {
						this.savedFields.set(
							pickDraftFields(this.type, saved.fields)
						);
					}
					const isPending = this.deps.store.isPending(this.id());
					this.state.set({ stage: isPending ? 'local' : 'saved' });
					if (isPending) {
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
				this.state.set({
					stage: 'conflict',
					conflict: { kind: 'draft', theirs: theirs.current }
				});
				return of(undefined);
			}
		}
		if (
			status === HttpStatusCode.NotFound &&
			this.deps.store.revisionOf(this.id()) !== undefined
		) {
			// Deleted elsewhere: keep the work as a new draft.
			return this.moveToNewDraft();
		}
		this.state.set({ stage: 'failed' });
		return throwError(() => error);
	}

	/** Carries the fields over to a new draft, deleting the old one. */
	private moveToNewDraft(): Observable<void> {
		const oldId = this.id();
		const hadServerCopy = this.deps.store.revisionOf(oldId) !== undefined;
		this.deps.store.forget(oldId);
		this.draftId.set(this.deps.createId());
		this.savedFields.set({});
		this.state.set({ stage: 'local' });
		this.keepLocally();
		if (hadServerCopy) {
			this.deps.store
				.delete(oldId)
				.pipe(catchError(() => EMPTY))
				.subscribe();
		}
		return this.save();
	}

	private toPublishConflict(error: unknown): Observable<never> {
		if (error instanceof HttpErrorResponse) {
			const theirs = (
				error.error as ConflictResponse<DraftItemOf<T>> | null
			)?.current;
			if (error.status === HttpStatusCode.Conflict && theirs) {
				this.state.set({
					stage: 'conflict',
					conflict: { kind: 'item', theirs }
				});
			} else if (
				error.status === HttpStatusCode.NotFound &&
				this.target
			) {
				this.state.set({
					stage: 'conflict',
					conflict: { kind: 'deleted' }
				});
			}
		}
		return throwError(() => error);
	}
}
