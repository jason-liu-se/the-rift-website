import { Injectable } from '@angular/core';
import {
	DraftContent,
	DraftTarget,
	EditorContentType
} from '../../interfaces/api-requests';

/** The `localStorage` key prefix for drafts; the draft's ID follows. */
export const LOCAL_DRAFT_KEY_PREFIX = 'draft:';

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
 * closed tab; DraftSyncService sends pending ones to the server. Storage can
 * be blocked or full: then only the offline copy is lost.
 */
@Injectable({
	providedIn: 'root'
})
export class LocalDraftsService {
	public save(draft: LocalDraft): void {
		try {
			localStorage.setItem(keyFor(draft.id), JSON.stringify(draft));
		} catch {
			// Nothing to do: the server copy still autosaves.
		}
	}

	public find(id: string): LocalDraft | undefined {
		try {
			const saved = localStorage.getItem(keyFor(id));
			return saved ? (JSON.parse(saved) as LocalDraft) : undefined;
		} catch {
			return undefined;
		}
	}

	public remove(id: string): void {
		try {
			localStorage.removeItem(keyFor(id));
		} catch {
			// Nothing to do.
		}
	}

	/** The owner's drafts in this browser, optionally of one type. */
	public list(owner: string, type?: EditorContentType): LocalDraft[] {
		try {
			return Object.keys(localStorage)
				.filter((key) => key.startsWith(LOCAL_DRAFT_KEY_PREFIX))
				.map(
					(key) =>
						JSON.parse(localStorage.getItem(key)!) as LocalDraft
				)
				.filter(
					(draft) =>
						draft.owner === owner && (!type || draft.type === type)
				);
		} catch {
			return [];
		}
	}
}

function keyFor(id: string): string {
	return `${LOCAL_DRAFT_KEY_PREFIX}${id}`;
}
