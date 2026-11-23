import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EditorContentType } from '../../interfaces/api-requests';
import { DraftSummary } from '../../interfaces/api-responses';
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

	public deleteDraft(id: string): Observable<void> {
		return this.http.delete<void>(
			`${this.draftsUrl}/${encodeURIComponent(id)}`,
			EDITOR_REQUEST_OPTIONS
		);
	}
}
