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
	Subject,
	catchError,
	filter,
	finalize,
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

/**
 * The `localStorage` key set while the API hasn't confirmed a logout. Only the
 * API can clear the httpOnly session cookies, so until it does, the old user
 * would be logged straight back in.
 */
export const LOGOUT_PENDING_KEY = 'logout-pending';

/**
 * Why a session ended without a logout in this tab: it expired (or was
 * revoked), or the user logged out in another tab.
 */
export type SessionEndReason = 'expired' | 'other-tab';

/** No answer from the API (status 0: offline, timeout) or a server error. */
const isUnreachable = (error: unknown): boolean =>
	!(error instanceof HttpErrorResponse) ||
	error.status === 0 ||
	error.status >= HttpStatusCode.InternalServerError;

export const isUnauthorized = (error: unknown): boolean =>
	error instanceof HttpErrorResponse &&
	error.status === HttpStatusCode.Unauthorized;

/**
 * The editor's login session, shared by the whole app. The API keeps it in
 * httpOnly cookies, so every request sends credentials, and
 * authRefreshInterceptor renews expired tokens (logging out here when that
 * fails). The last-known user is kept in `localStorage`, so that it still
 * shows while the API is down and every tab logs out together.
 *
 * Logging out always succeeds for the user at once; if the API can't be
 * reached, it's retried until it can (see `finishLogout`).
 */
@Injectable({
	providedIn: 'root'
})
export class AuthService {
	private http = inject(HttpClient);
	private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
	private readonly state = signal<SessionUser | null | undefined>(undefined);
	private check$?: Observable<unknown>;
	private finishLogout$?: Observable<boolean>;
	/**
	 * Counts logouts, in this tab or another, so a session check started
	 * before one can be ignored.
	 */
	private logouts = 0;
	private readonly ended = new Subject<SessionEndReason>();

	/** Starts a Discord login; navigate to it, don't fetch it. */
	public readonly loginUrl = `${environment.API_URL}/auth/discord`;

	/**
	 * The logged-in user, or `null` when nobody is. `undefined` until the
	 * session is checked, and always on the server, which can't see the API's
	 * cookies. While the API can't be reached, it's the last-known user.
	 */
	public readonly user = this.state.asReadonly();

	/** Each session that ends without a logout in this tab, and why. */
	public readonly sessionEnded = this.ended.asObservable();

	constructor() {
		if (this.isBrowser) {
			// Fires for changes made in other tabs only.
			fromEvent<StorageEvent>(window, 'storage')
				.pipe(
					filter(({ key }) => key === SAVED_USER_KEY || key === null),
					takeUntilDestroyed()
				)
				.subscribe(() => {
					const user = this.readSavedUser();
					const wasLoggedOut = this.state() === null;
					this.state.set(user);
					if (!user) {
						// A logout there: a check here may have started before it.
						this.logouts++;
						if (!wasLoggedOut) {
							// `logout()` marks its logout pending first; otherwise
							// the session expired there.
							this.ended.next(
								this.isLogoutPending() ? 'other-tab' : 'expired'
							);
						}
					}
				});
			// An earlier logout may not have reached the API (it was down, or
			// the browser closed first). After construction, because
			// authRefreshInterceptor injects this service.
			if (this.isLogoutPending()) {
				queueMicrotask(() => this.retryPendingLogout());
			}
			fromEvent(window, 'online')
				.pipe(takeUntilDestroyed())
				.subscribe(() => this.retryPendingLogout());
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
		if (this.isLogoutPending()) {
			// Don't make guards wait on the request: it's retried in the
			// background and the user is logged out either way.
			this.retryPendingLogout();
			return of(null);
		}
		this.check$ ??= this.fetchSession();
		return this.check$.pipe(map(() => this.state() ?? null));
	}

	/** Ends the session here, after the API ended it (a refresh failed). */
	public markLoggedOut(): void {
		const hadUser = !!this.state() || this.hasSavedUser();
		this.setUser(null);
		if (hadUser) {
			this.ended.next('expired');
		}
	}

	/**
	 * Logs out here at once, then tells the API in the background. If that
	 * fails, the logout stays pending and is retried (see `finishLogout`).
	 */
	public logout(): void {
		// Later checks reuse this page load's check: they read `state()`, and
		// the counter keeps an answer that's still on its way from changing it.
		this.logouts++;
		// Pending first: other tabs read it to tell a logout from an expiry.
		this.setLogoutPending(true);
		this.setUser(null);
		this.finishLogout().subscribe();
	}

	/** Whether a user is saved: the last session check found one. */
	public hasSavedUser(): boolean {
		return this.readSavedUser() !== null;
	}

	/** Whether the API still has to be told about a logout. */
	public isLogoutPending(): boolean {
		if (!this.isBrowser) {
			return false;
		}
		try {
			return localStorage.getItem(LOGOUT_PENDING_KEY) !== null;
		} catch {
			return false;
		}
	}

	/**
	 * Sends the pending logout to the API (one request at a time, shared by
	 * every caller) and resolves to whether it's done. Done on any answer from
	 * the API (a 401 means the session had already ended, and retrying a 4xx
	 * would never help); not done when it can't be reached (no answer, or 5xx).
	 */
	public finishLogout(): Observable<boolean> {
		this.finishLogout$ ??= this.http
			.post<void>(`${environment.API_URL}/auth/logout`, null, {
				withCredentials: true
			})
			.pipe(
				map(() => true),
				catchError((error: unknown) => of(!isUnreachable(error))),
				tap((done) => {
					if (done) {
						this.setLogoutPending(false);
					}
				}),
				finalize(() => (this.finishLogout$ = undefined)),
				shareReplay(1)
			);
		return this.finishLogout$;
	}

	private retryPendingLogout(): void {
		if (this.isLogoutPending()) {
			this.finishLogout().subscribe();
		}
	}

	private setLogoutPending(pending: boolean): void {
		if (!this.isBrowser) {
			return;
		}
		try {
			if (pending) {
				localStorage.setItem(LOGOUT_PENDING_KEY, 'true');
			} else {
				localStorage.removeItem(LOGOUT_PENDING_KEY);
			}
		} catch {
			// Nothing to do: only the retry is lost.
		}
	}

	private fetchSession(): Observable<unknown> {
		const startedAt = this.logouts;
		const loggedOutSince = () => this.logouts !== startedAt;
		return this.http
			.get<SessionUser>(`${environment.API_URL}/auth/me`, {
				withCredentials: true,
				context: unversioned()
			})
			.pipe(
				// A logout in the meantime wins, whenever the API answers.
				tap((user) => {
					if (!loggedOutSince()) {
						this.setUser(user);
					}
				}),
				catchError((error: unknown) => {
					if (loggedOutSince()) {
						// Logged out since: nothing to restore, and nothing to ask again.
						return of(null);
					}
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
