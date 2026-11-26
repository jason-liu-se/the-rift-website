import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
	EMPTY,
	Observable,
	ReplaySubject,
	Subject,
	catchError,
	concatMap,
	defer,
	filter,
	from,
	map,
	of,
	pairwise,
	tap,
	throwError
} from 'rxjs';
import { DraftSaveRequest, DraftType } from 'src/app/interfaces/api-requests';
import { Draft, DraftSummary } from 'src/app/interfaces/api-responses';
import { ApiStatusService } from 'src/app/services/api-status/api-status.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { DraftsService } from 'src/app/services/drafts/drafts.service';
import {
	LocalDraft,
	LocalDraftsService
} from 'src/app/services/drafts/local-drafts.service';

/** A draft's content as an editing session keeps it. */
export type DraftCopy = Omit<
	LocalDraft,
	'owner' | 'revision' | 'isPending' | 'updatedAt'
>;

interface Write {
	run: () => Observable<unknown>;
	result: ReplaySubject<unknown>;
}

/**
 * Every draft write, and the copies kept in this browser. The server holds
 * the drafts; this browser keeps a copy only while a change is waiting for
 * it (offline, or until typing pauses), and drops it once saved. Every save
 * and delete runs through one queue, so autosave, retries, publishing, and
 * syncing never race.
 *
 * `sync()` (when the admin page opens, and whenever the API comes back)
 * reconciles each copy with the server: sends it, keeps it for a conflict
 * the editor resolves when opening it, or recreates a draft deleted
 * elsewhere.
 */
@Injectable({ providedIn: 'root' })
export class DraftStore {
	private drafts = inject(DraftsService);
	private local = inject(LocalDraftsService);
	private auth = inject(AuthService);
	private apiStatus = inject(ApiStatusService).status;

	/** The server revision of each draft this tab has saved or opened. */
	private readonly revisions = new Map<string, number>();
	/** How many changes each draft has had in this tab, to tell a newer one. */
	private readonly changeCounts = new Map<string, number>();
	private readonly writes = new Subject<Write>();
	private readonly pending = signal<ReadonlySet<string>>(new Set());

	constructor() {
		this.pending.set(new Set(this.pendingCopiesNow().map(({ id }) => id)));
		this.writes
			.pipe(
				concatMap(({ run, result }) =>
					run().pipe(
						tap(result),
						catchError(() => EMPTY)
					)
				)
			)
			.subscribe();
		toObservable(this.apiStatus)
			.pipe(
				pairwise(),
				filter(([previous, now]) => previous !== 'up' && now === 'up')
			)
			.subscribe(() => this.sync());
	}

	/** Whether a change to the draft is waiting for the server. */
	public isPending(id: string): boolean {
		return this.pending().has(id);
	}

	/** The editor's drafts waiting for the server, optionally of one type. */
	public pendingCopies(type?: DraftType): LocalDraft[] {
		// Read in a `computed`, this updates as copies are kept or dropped.
		this.pending();
		return this.pendingCopiesNow(type);
	}

	public findPending(id: string): LocalDraft | undefined {
		const copy = this.local.find(id);
		return copy?.isPending ? copy : undefined;
	}

	/** The server's drafts, with this browser's waiting changes on top. */
	public withPending(
		serverDrafts: readonly DraftSummary[],
		type: DraftType
	): DraftSummary[] {
		const copies = new Map(
			this.pendingCopies(type).map((copy) => [copy.id, copy])
		);
		const merged = serverDrafts.map((draft) => {
			const copy = copies.get(draft.id);
			copies.delete(draft.id);
			return copy
				? ({ ...draft, fields: copy.fields } as DraftSummary)
				: draft;
		});
		const notYetSent = [...copies.values()].map(
			({ id, fields, target, updatedAt }) =>
				({
					id,
					type,
					fields,
					target,
					revision: 0,
					createdAt: updatedAt,
					updatedAt
				}) as DraftSummary
		);
		return [...notYetSent, ...merged];
	}

	public revisionOf(id: string): number | undefined {
		return this.revisions.get(id) ?? this.local.find(id)?.revision;
	}

	/** The server has the draft at `revision` (it was just opened). */
	public noteRevision(id: string, revision: number): void {
		this.revisions.set(id, revision);
	}

	/** Keeps a change in this browser until the server has it. */
	public keep(copy: DraftCopy): void {
		this.changeCounts.set(
			copy.id,
			(this.changeCounts.get(copy.id) ?? 0) + 1
		);
		this.local.save({
			...copy,
			owner: this.owner(),
			revision: this.revisionOf(copy.id),
			isPending: true,
			updatedAt: new Date().toISOString()
		} as LocalDraft);
		this.setPending(copy.id, true);
	}

	/** Drops this browser's copy (the server has the change, or it's gone). */
	public dropCopy(id: string): void {
		this.local.remove(id);
		this.setPending(id, false);
	}

	/** Forgets the draft entirely: its copy and its revision. */
	public forget(id: string): void {
		this.dropCopy(id);
		this.revisions.delete(id);
	}

	/**
	 * Sends the draft's waiting change (queued). Emits the server's draft, or
	 * undefined if nothing was waiting; errors as the server answered (409,
	 * 404) or with no answer.
	 */
	public send(id: string): Observable<Draft | undefined> {
		return this.enqueue(() => {
			const copy = this.findPending(id);
			if (!copy) {
				return of(undefined);
			}
			const revision = this.revisionOf(id);
			const changeCount = this.changeCounts.get(id);
			const request = {
				type: copy.type,
				fields: copy.fields,
				...(revision === undefined
					? { target: copy.target }
					: { startingRevision: revision })
			} as DraftSaveRequest;
			return this.drafts.saveDraft(id, request).pipe(
				tap((saved) => {
					this.revisions.set(id, saved.revision);
					const latest = this.findPending(id);
					if (this.changeCounts.get(id) === changeCount) {
						this.dropCopy(id);
					} else if (latest) {
						// Changed again while saving: still waiting.
						this.local.save({
							...latest,
							revision: saved.revision
						});
					}
				})
			);
		});
	}

	/** Deletes the draft (queued); one already gone counts as deleted. */
	public delete(id: string): Observable<void> {
		return this.enqueue(() =>
			this.drafts.deleteDraft(id).pipe(
				catchError((error: unknown) =>
					isNotFound(error) ? of(undefined) : throwError(() => error)
				),
				map(() => this.forget(id))
			)
		);
	}

	/**
	 * Reconciles this browser's copies with the server's drafts, sending each
	 * one the server can take. A copy of a draft that changed elsewhere stays
	 * for the editor to resolve when opening it.
	 */
	public sync(): void {
		if (this.apiStatus() !== 'up' || !this.auth.user()) {
			return;
		}
		this.drafts.fetchDrafts().subscribe({
			next: (serverDrafts) => {
				const onServer = new Map(
					serverDrafts.map(({ id, revision }) => [id, revision])
				);
				const toSend = this.local
					.list(this.owner())
					.flatMap((copy) => this.reconcile(copy, onServer));
				from(toSend)
					.pipe(
						concatMap((id) =>
							this.send(id).pipe(catchError(() => EMPTY))
						)
					)
					.subscribe();
			},
			error: () => undefined
		});
	}

	/** What to do with one copy: the IDs to send (none, or its own or new). */
	private reconcile(
		copy: LocalDraft,
		onServer: ReadonlyMap<string, number>
	): string[] {
		if (!copy.isPending) {
			this.forget(copy.id);
			return [];
		}
		this.setPending(copy.id, true);
		const revision = this.revisionOf(copy.id);
		const serverRevision = onServer.get(copy.id);
		if (revision === undefined || serverRevision === revision) {
			return [copy.id];
		}
		if (serverRevision === undefined) {
			// Deleted elsewhere: a deleted draft's ID can't be reused.
			const id = crypto.randomUUID();
			this.forget(copy.id);
			this.keep({ ...copy, id });
			return [id];
		}
		return [];
	}

	private enqueue<T>(run: () => Observable<T>): Observable<T> {
		return defer(() => {
			const result = new ReplaySubject<unknown>(1);
			this.writes.next({ run, result });
			return result as Observable<T>;
		});
	}

	private setPending(id: string, isPending: boolean): void {
		const pending = new Set(this.pending());
		if (isPending) {
			pending.add(id);
		} else {
			pending.delete(id);
		}
		this.pending.set(pending);
	}

	private pendingCopiesNow(type?: DraftType): LocalDraft[] {
		return this.local
			.list(this.owner(), type)
			.filter(({ isPending }) => isPending);
	}

	private owner(): string {
		return this.auth.user()?.id ?? '';
	}
}

function isNotFound(error: unknown): boolean {
	return (
		error instanceof HttpErrorResponse &&
		error.status === HttpStatusCode.NotFound
	);
}
