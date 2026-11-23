import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
	DraftPublishRequest,
	DraftSaveRequest,
	EditorContentType
} from '../../interfaces/api-requests';
import { Draft, DraftSummary } from '../../interfaces/api-responses';
import { ItemOf } from '../editor-content/editor-content-types';
import { EDITOR_REQUEST_OPTIONS } from '../editor-content/editor-request-options';

/** The editor's own drafts (`/editor/drafts`, logged in, private to them). */
@Injectable({
	providedIn: 'root'
})
export class DraftsService {
	private http = inject(HttpClient);
	private draftsUrl = `${environment.API_URL}/editor/drafts`;

	/** The editor's drafts of one content type, most recently saved first. */
	public fetchDrafts(type: EditorContentType): Observable<DraftSummary[]> {
		return this.http.get<DraftSummary[]>(this.draftsUrl, {
			...EDITOR_REQUEST_OPTIONS,
			params: { type }
		});
	}

	public fetchDraft(id: string): Observable<Draft> {
		return this.http.get<Draft>(this.draftUrl(id), EDITOR_REQUEST_OPTIONS);
	}

	/**
	 * Creates the draft (no `startingRevision`) or saves it. 409 with the
	 * draft as it is when another device saved since, or when an edit draft
	 * of the same item exists.
	 */
	public saveDraft(id: string, request: DraftSaveRequest): Observable<Draft> {
		return this.http.put<Draft>(
			this.draftUrl(id),
			request,
			EDITOR_REQUEST_OPTIONS
		);
	}

	/**
	 * Publishes the draft as its item. 409 with the item as it is when it
	 * changed since the draft started; 404 when it was deleted.
	 */
	public publishDraft<T extends EditorContentType>(
		id: string,
		request: DraftPublishRequest
	): Observable<ItemOf<T>> {
		return this.http.post<ItemOf<T>>(
			`${this.draftUrl(id)}/publish`,
			request,
			EDITOR_REQUEST_OPTIONS
		);
	}

	public deleteDraft(id: string): Observable<void> {
		return this.http.delete<void>(
			this.draftUrl(id),
			EDITOR_REQUEST_OPTIONS
		);
	}

	private draftUrl(id: string): string {
		return `${this.draftsUrl}/${encodeURIComponent(id)}`;
	}
}
