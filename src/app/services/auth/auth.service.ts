import { isPlatformBrowser } from '@angular/common';
import {
	HttpClient,
	HttpErrorResponse,
	HttpStatusCode
} from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
	Observable,
	catchError,
	filter,
	fromEvent,
	map,
	of,
	shareReplay,
	tap
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionUser } from '../../interfaces/api-responses';
import { unversioned } from '../content-version/content-version.service';

/** The `localStorage` key holding the last-known user. */
export const SAVED_USER_KEY = 'session-user';

export const isUnauthorized = (error: unknown): boolean =>
	error instanceof HttpErrorResponse &&
	error.status === HttpStatusCode.Unauthorized;

/**
 * The editor's login session, shared by the whole app. The API keeps it in
 * httpOnly cookies, so every request sends credentials, and
 * authRefreshInterceptor renews expired tokens (logging out here when that
 * fails). The last-known user is kept in `localStorage`, so that it still
 * shows while the API is down and every tab logs out together.
 */
@Injectable({
	providedIn: 'root'
})
export class AuthService {
	private http = inject(HttpClient);
	private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
	private readonly state = signal<SessionUser | null | undefined>(undefined);
	private check$?: Observable<unknown>;

	/** Starts a Discord login; navigate to it, don't fetch it. */
	public readonly loginUrl = `${environment.API_URL}/auth/discord`;

	/**
	 * The logged-in user, or `null` when nobody is. `undefined` until the
	 * session is checked, and always on the server, which can't see the API's
	 * cookies. While the API can't be reached, it's the last-known user.
	 */
	public readonly user = this.state.asReadonly();

	constructor() {
		if (this.isBrowser) {
			// Fires for changes made in other tabs only.
			fromEvent<StorageEvent>(window, 'storage')
				.pipe(
					filter(({ key }) => key === SAVED_USER_KEY || key === null),
					takeUntilDestroyed()
				)
				.subscribe(() => this.state.set(this.readSavedUser()));
		}
	}

	/**
	 * Checks the session with the API once per page load, shared by every
	 * caller, and resolves to the user (`null` when logged out). A check that
	 * fails for any reason but a 401 (the API is down) keeps the last-known
	 * user and isn't kept, so the next caller checks again.
	 */
	public checkSession(): Observable<SessionUser | null> {
		if (!this.isBrowser) {
			return of(null);
		}
		this.check$ ??= this.fetchSession();
		return this.check$.pipe(map(() => this.state() ?? null));
	}

	/** Ends the session here, after the API ended it (a refresh failed). */
	public markLoggedOut(): void {
		this.setUser(null);
	}

	public logout(): Observable<void> {
		return this.http
			.post<void>(`${environment.API_URL}/auth/logout`, null, {
				withCredentials: true
			})
			.pipe(tap(() => this.setUser(null)));
	}

	private fetchSession(): Observable<unknown> {
		return this.http
			.get<SessionUser>(`${environment.API_URL}/auth/me`, {
				withCredentials: true,
				context: unversioned()
			})
			.pipe(
				tap((user) => this.setUser(user)),
				catchError((error: unknown) => {
					if (isUnauthorized(error)) {
						this.setUser(null);
					} else {
						this.state.set(this.readSavedUser());
						this.check$ = undefined;
					}
					return of(null);
				}),
				shareReplay(1)
			);
	}

	private setUser(user: SessionUser | null): void {
		this.state.set(user);
		if (!this.isBrowser) {
			return;
		}
		// Storage can be blocked or full; the session still works without it.
		try {
			if (user) {
				localStorage.setItem(SAVED_USER_KEY, JSON.stringify(user));
			} else {
				localStorage.removeItem(SAVED_USER_KEY);
			}
		} catch {
			// Nothing to do: only the API-down fallback and tab syncing are lost.
		}
	}

	private readSavedUser(): SessionUser | null {
		try {
			const saved = localStorage.getItem(SAVED_USER_KEY);
			return saved ? (JSON.parse(saved) as SessionUser) : null;
		} catch {
			return null;
		}
	}
}
