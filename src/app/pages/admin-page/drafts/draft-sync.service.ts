import { Injectable, inject } from '@angular/core';
import { EMPTY, catchError, concatMap, from, tap } from 'rxjs';
import { AuthService } from 'src/app/services/auth/auth.service';
import { DraftsService } from 'src/app/services/drafts/drafts.service';
import {
	LocalDraft,
	LocalDraftsService
} from 'src/app/services/drafts/local-drafts.service';

/**
 * Sends drafts saved in this browser while the server couldn't be reached
 * (or before a tab closed) once it can: when the admin page opens, and when
 * the API comes back. One at a time, to stay under the write limit. A
 * conflict is left for when the editor opens that draft.
 */
@Injectable({ providedIn: 'root' })
export class DraftSyncService {
	private drafts = inject(DraftsService);
	private localDrafts = inject(LocalDraftsService);
	private auth = inject(AuthService);

	/** Sends every pending draft but `openDraftId`, whose session saves itself. */
	public syncPending(openDraftId?: string): void {
		const owner = this.auth.user()?.id;
		if (!owner) {
			return;
		}
		const pending = this.localDrafts
			.list(owner)
			.filter(({ id, isPending }) => isPending && id !== openDraftId);
		from(pending)
			.pipe(concatMap((draft) => this.send(draft)))
			.subscribe();
	}

	private send(local: LocalDraft) {
		const { id, type, fields, target, revision } = local;
		return this.drafts
			.saveDraft(id, {
				type,
				fields,
				...(revision === undefined
					? { target }
					: { startingRevision: revision })
			} as Parameters<DraftsService['saveDraft']>[1])
			.pipe(
				tap((saved) =>
					this.localDrafts.save({
						...local,
						revision: saved.revision,
						isPending: false
					})
				),
				catchError(() => EMPTY)
			);
	}
}
