import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, switchMap, throwError } from 'rxjs';
import { EditorContentType } from 'src/app/interfaces/api-requests';
import { Draft } from 'src/app/interfaces/api-responses';
import { ApiStatusService } from 'src/app/services/api-status/api-status.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { DraftsService } from 'src/app/services/drafts/drafts.service';
import {
	LocalDraft,
	LocalDraftsService
} from 'src/app/services/drafts/local-drafts.service';
import { ItemOf } from 'src/app/services/editor-content/editor-content-types';
import { DraftFields, pickFields } from './draft-fields';
import { DraftSession, DraftSessionStart } from './draft-session';

/**
 * Starts editing sessions: a new item, a copy of one, an edit of a published
 * item (resuming the editor's draft of it, if any), or an existing draft
 * (this browser's copy, if it has changes the server hasn't saved).
 */
@Injectable({ providedIn: 'root' })
export class DraftSessionsService {
	private drafts = inject(DraftsService);
	private localDrafts = inject(LocalDraftsService);
	private apiStatus = inject(ApiStatusService);
	private auth = inject(AuthService);

	/** A new item, starting from `fields` (defaults, which aren't changes). */
	public startNew<T extends EditorContentType>(
		type: T,
		fields: DraftFields<T> = {}
	): DraftSession<T> {
		return this.create({ type, fields, baseline: fields });
	}

	/** A new draft with the item's fields (Duplicate). */
	public startCopy<T extends EditorContentType>(
		type: T,
		item: ItemOf<T>
	): DraftSession<T> {
		return this.create({
			type,
			fields: pickFields(type, item),
			baseline: {}
		});
	}

	/** Edits a published item, carrying on with the editor's draft of it. */
	public startEdit<T extends EditorContentType>(
		type: T,
		item: ItemOf<T>
	): Observable<DraftSession<T>> {
		const local = this.localDrafts
			.list(this.owner(), type)
			.find(({ target }) => target?.id === item.id);
		if (local) {
			return of(this.fromLocal(type, local, pickFields(type, item)));
		}
		const fresh = () =>
			this.create({
				type,
				fields: pickFields(type, item),
				baseline: pickFields(type, item),
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

	/** Opens a draft by ID: the server's, or this browser's newer copy. */
	public openDraft<T extends EditorContentType>(
		type: T,
		id: string
	): Observable<DraftSession<T>> {
		const local = this.localDrafts.find(id);
		return this.drafts.fetchDraft(id).pipe(
			map((draft) =>
				local?.isPending && local.revision === draft.revision
					? this.fromLocal(
							type,
							local,
							pickFields(type, draft.fields)
						)
					: this.fromServer(type, draft)
			),
			catchError((error: unknown) =>
				local
					? of(this.fromLocal(type, local, {}))
					: throwError(() => error)
			)
		);
	}

	private fromServer<T extends EditorContentType>(
		type: T,
		draft: Draft
	): DraftSession<T> {
		const fields = pickFields(type, draft.fields);
		return this.create({
			type,
			id: draft.id,
			fields,
			baseline: fields,
			target: draft.target,
			revision: draft.revision
		});
	}

	private fromLocal<T extends EditorContentType>(
		type: T,
		local: LocalDraft,
		baseline: DraftFields<T>
	): DraftSession<T> {
		return this.create({
			type,
			id: local.id,
			fields: pickFields(type, local.fields),
			baseline,
			target: local.target,
			revision: local.revision,
			isPending: local.isPending
		});
	}

	private create<T extends EditorContentType>(
		start: Omit<DraftSessionStart<T>, 'owner'>
	): DraftSession<T> {
		return new DraftSession(
			{ ...start, owner: this.owner() },
			{
				drafts: this.drafts,
				localDrafts: this.localDrafts,
				apiStatus: this.apiStatus.status,
				createId: () => crypto.randomUUID()
			}
		);
	}

	private owner(): string {
		return this.auth.user()?.id ?? '';
	}
}
