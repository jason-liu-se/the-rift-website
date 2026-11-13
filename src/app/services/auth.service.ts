import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SessionUser } from '../interfaces/api-responses';

/**
 * The editor's login session. The API keeps it in httpOnly cookies, so every
 * request sends credentials; authRefreshInterceptor renews expired tokens.
 */
@Injectable({
	providedIn: 'root'
})
export class AuthService {
	private http = inject(HttpClient);

	/** Starts a Discord login; navigate to it, don't fetch it. */
	public readonly loginUrl = `${environment.API_URL}/auth/discord`;

	/** The logged-in user; errors (401) when nobody is logged in. */
	public getMe(): Observable<SessionUser> {
		return this.http.get<SessionUser>(`${environment.API_URL}/auth/me`, {
			withCredentials: true
		});
	}

	public logout(): Observable<void> {
		return this.http.post<void>(
			`${environment.API_URL}/auth/logout`,
			null,
			{
				withCredentials: true
			}
		);
	}
}
