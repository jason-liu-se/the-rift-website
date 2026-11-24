import { Injectable, inject } from '@angular/core';
import {
	DraftContent,
	DraftTarget,
	EditorContentType
} from '../../interfaces/api-requests';
import {
	BrowserStorage,
	STORAGE_KEYS
} from '../browser-storage/browser-storage.service';

/** A draft as this browser last saw it, saved as the editor types. */
export type LocalDraft = DraftContent & {
	id: string;
	/** The editor it belongs to (Discord user ID). */
	owner: string;
	target?: DraftTarget;
	/** The server's revision of the draft, once it has one. */
	revision?: number;
	/** Changed since the server last saved it: sync it when possible. */
	isPending: boolean;
	/** ISO 8601 */
	updatedAt: string;
};

/**
 * Drafts kept in `localStorage`, so editing works offline and survives a
 * closed tab; DraftSyncService sends pending ones to the server. If storage
 * is blocked or full, only the offline copy is lost.
 */
@Injectable({
	providedIn: 'root'
})
export class LocalDraftsService {
	private storage = inject(BrowserStorage);

	public save(draft: LocalDraft): void {
		this.storage.setJson('local', keyFor(draft.id), draft);
	}

	public find(id: string): LocalDraft | undefined {
		return this.storage.getJson<LocalDraft>('local', keyFor(id));
	}

	public remove(id: string): void {
		this.storage.remove('local', keyFor(id));
	}

	/** The owner's drafts in this browser, optionally of one type. */
	public list(owner: string, type?: EditorContentType): LocalDraft[] {
		return this.storage
			.keys('local', STORAGE_KEYS.draftPrefix)
			.flatMap(
				(key) => this.storage.getJson<LocalDraft>('local', key) ?? []
			)
			.filter(
				(draft) =>
					draft.owner === owner && (!type || draft.type === type)
			);
	}
}

function keyFor(id: string): string {
	return `${STORAGE_KEYS.draftPrefix}${id}`;
}
