import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, switchMap, throwError } from 'rxjs';
import { EditorContentType } from 'src/app/interfaces/api-requests';
import { ApiStatusService } from 'src/app/services/api-status/api-status.service';
import { DraftsService } from 'src/app/services/drafts/drafts.service';
import { LocalDraft } from 'src/app/services/drafts/local-drafts.service';
import { ItemOf } from 'src/app/services/editor-content/editor-content-types';
import { DraftFields, pickFields, withVisibility } from './draft-fields';
import { DraftSession, DraftSessionStart } from './draft-session';
import { DraftStore } from './draft-store.service';

/**
 * Starts editing sessions: a new item, an edit of a published item (resuming
 * the editor's draft of it, if any), or an existing draft (with this
 * browser's waiting change on top, if it has one).
 */
@Injectable({ providedIn: 'root' })
export class DraftSessionsService {
	private drafts = inject(DraftsService);
	private store = inject(DraftStore);
	private apiStatus = inject(ApiStatusService);

	/** A new item, starting from `fields` (defaults, which aren't changes). */
	public startNew<T extends EditorContentType>(
		type: T,
		fields: DraftFields<T> = {}
	): DraftSession<T> {
		return this.create({ type, fields, baseline: fields });
	}

	/** Edits a published item, carrying on with the editor's draft of it. */
	public startEdit<T extends EditorContentType>(
		type: T,
		item: ItemOf<T>
	): Observable<DraftSession<T>> {
		const published = pickFields(type, item);
		const waiting = this.store
			.pendingCopies(type)
			.find(({ target }) => target?.id === item.id);
		if (waiting) {
			return of(this.fromCopy(type, waiting, published));
		}
		const fresh = () =>
			this.create({
				type,
				fields: published,
				baseline: published,
				target: { id: item.id, startingRevision: item.revision }
			});
		return this.drafts.fetchDrafts(type).pipe(
			map((drafts) =>
				drafts.find(({ target }) => target?.id === item.id)
			),
			switchMap((existing) =>
				existing ? this.openDraft(type, existing.id) : of(fresh())
			),
			catchError(() => of(fresh()))
		);
	}

	/**
	 * Opens a draft by ID: the server's, with this browser's waiting change
	 * on top (sending it may then find a conflict for the editor to resolve).
	 */
	public openDraft<T extends EditorContentType>(
		type: T,
		id: string
	): Observable<DraftSession<T>> {
		const waiting = this.store.findPending(id);
		return this.drafts.fetchDraft(id).pipe(
			map((draft) => {
				this.store.noteRevision(draft.id, draft.revision);
				const saved = pickFields(type, draft.fields);
				return waiting
					? this.fromCopy(type, waiting, saved, saved)
					: this.create({
							type,
							id: draft.id,
							fields: saved,
							baseline: saved,
							savedFields: saved,
							target: draft.target
						});
			}),
			catchError((error: unknown) =>
				waiting
					? of(this.fromCopy(type, waiting, {}))
					: throwError(() => error)
			)
		);
	}

	private fromCopy<T extends EditorContentType>(
		type: T,
		copy: LocalDraft,
		baseline: DraftFields<T>,
		savedFields?: DraftFields<T>
	): DraftSession<T> {
		return this.create({
			type,
			id: copy.id,
			fields: pickFields(type, copy.fields),
			baseline,
			savedFields,
			target: copy.target
		});
	}

	private create<T extends EditorContentType>(
		start: DraftSessionStart<T>
	): DraftSession<T> {
		const session = {
			...start,
			fields: withVisibility(start.fields),
			baseline: withVisibility(start.baseline)
		};
		return new DraftSession(session, {
			drafts: this.drafts,
			store: this.store,
			apiStatus: this.apiStatus.status,
			createId: () => crypto.randomUUID()
		});
	}
}
