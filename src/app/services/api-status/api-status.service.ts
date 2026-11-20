import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
	DestroyRef,
	Injectable,
	PLATFORM_ID,
	Signal,
	computed,
	effect,
	inject,
	signal,
	untracked
} from '@angular/core';
import {
	EMPTY,
	Observable,
	Subject,
	Subscription,
	catchError,
	exhaustMap,
	fromEvent,
	map,
	merge,
	startWith,
	switchMap,
	timer
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_HEALTH_CHECK_INTERVAL_MS } from '../../config/api';
import { AuthService } from '../auth/auth.service';
import { unversioned } from '../content-version/content-version.service';

/** The API's health endpoint, which only the status checks request. */
export const API_HEALTH_URL = `${environment.API_URL}/health`;

export type ApiStatus = 'up' | 'down' | 'offline';

/**
 * Whether the browser can use The Rift's API. `apiStatusInterceptor` reports
 * every API response or failure here; while the API is down, a health check
 * runs until it answers. Browser only: on the server it stays 'up', since
 * server renders already cope with a failing API (SERVER_API_TIMEOUT_MS).
 */
@Injectable({
	providedIn: 'root'
})
export class ApiStatusService {
	private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
	private readonly document = inject(DOCUMENT);
	private readonly http = inject(HttpClient);
	private readonly destroyRef = inject(DestroyRef);
	private readonly auth = inject(AuthService);

	private readonly apiDown = signal(false);
	private readonly browserOnline = signal(true);
	private healthChecks?: Subscription;
	private readonly checkNow = new Subject<void>();

	/** Offline wins: while the network is gone, the API's state is unknown. */
	public readonly status: Signal<ApiStatus> = computed(() => {
		if (!this.browserOnline()) {
			return 'offline';
		}
		return this.apiDown() ? 'down' : 'up';
	});

	constructor() {
		if (!this.isBrowser) {
			return;
		}
		const window = this.document.defaultView!;
		this.browserOnline.set(window.navigator.onLine);
		const connection = merge(
			fromEvent(window, 'online').pipe(map(() => true)),
			fromEvent(window, 'offline').pipe(map(() => false))
		).subscribe((online) => this.browserOnline.set(online));
		// The API can be reached again: tell it about a logout it missed.
		let previous = this.status();
		effect(() => {
			const current = this.status();
			untracked(() => {
				if (
					previous !== 'up' &&
					current === 'up' &&
					this.auth.isLogoutPending()
				) {
					this.auth.finishLogout().subscribe();
				}
				previous = current;
			});
		});
		this.destroyRef.onDestroy(() => {
			connection.unsubscribe();
			this.healthChecks?.unsubscribe();
		});
	}

	/**
	 * A health check got a response, so the API is up. Other responses can't
	 * say so: the browser may answer a GET from its HTTP cache, without the API.
	 */
	public reportUp(): void {
		if (!this.isBrowser) {
			return;
		}
		this.apiDown.set(false);
		this.healthChecks?.unsubscribe();
		this.healthChecks = undefined;
	}

	/**
	 * Another API request got a response. While the API is down that could be
	 * a cached one, so it only brings the next health check forward.
	 */
	public reportResponse(): void {
		if (this.apiDown()) {
			this.checkNow.next();
		}
	}

	/** An API request failed: network error, timeout, or a 5xx response. */
	public reportDown(): void {
		if (!this.isBrowser || this.apiDown()) {
			return;
		}
		this.apiDown.set(true);
		this.healthChecks = this.checkHealthUntilUp().subscribe();
	}

	/**
	 * Checks `/health` every interval while the tab is visible, and at once
	 * when the browser comes back online or the tab becomes visible. Each
	 * answer reaches `reportUp` through the interceptor.
	 */
	private checkHealthUntilUp(): Observable<unknown> {
		const window = this.document.defaultView!;
		// null pauses the checks while the tab is hidden or the browser is
		// offline (the `online` event checks at once).
		const firstCheckIn = (immediately: boolean) =>
			this.document.visibilityState !== 'visible' || !this.browserOnline()
				? null
				: immediately
					? 0
					: API_HEALTH_CHECK_INTERVAL_MS;

		return merge(
			fromEvent(window, 'online'),
			fromEvent(window, 'offline'),
			fromEvent(this.document, 'visibilitychange'),
			this.checkNow
		).pipe(
			map(() => firstCheckIn(true)),
			// The request that failed was just now, so the first check can wait.
			startWith(firstCheckIn(false)),
			switchMap((delay) =>
				delay === null
					? EMPTY
					: timer(delay, API_HEALTH_CHECK_INTERVAL_MS)
			),
			// A check still running (up to the interval) isn't doubled up.
			exhaustMap(() =>
				this.http
					.get(API_HEALTH_URL, {
						context: unversioned(),
						// Always asks the API, never the browser's cache.
						cache: 'no-store',
						timeout: API_HEALTH_CHECK_INTERVAL_MS
					})
					.pipe(catchError(() => EMPTY))
			)
		);
	}
}
