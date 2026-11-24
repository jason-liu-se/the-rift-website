import { Injectable, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { EditorContentType } from 'src/app/interfaces/api-requests';
import { ApiStatusService } from 'src/app/services/api-status/api-status.service';
import { DraftSession } from './draft-session';
import { DraftSyncService } from './draft-sync.service';
import { filter, pairwise } from 'rxjs';

/**
 * The draft open in the editor modal, if any, and sending drafts saved only
 * in this browser: when the admin page opens, and when the API comes back
 * (the open draft saves itself, so the sync skips it). Provided by the admin
 * page.
 */
@Injectable()
export class OpenDraftService {
	private sync = inject(DraftSyncService);

	public readonly session = signal<
		DraftSession<EditorContentType> | undefined
	>(undefined);

	constructor() {
		this.sync.syncPending();
		toObservable(inject(ApiStatusService).status)
			.pipe(
				pairwise(),
				filter(([previous, now]) => previous !== 'up' && now === 'up')
			)
			.subscribe(() => {
				const session = this.session();
				session?.saveNow().subscribe({ error: () => undefined });
				this.sync.syncPending(session?.id());
			});
	}
}
