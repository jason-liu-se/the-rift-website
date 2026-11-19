import {
	HttpClient,
	HttpContext,
	HttpContextToken
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CONTENT_VERSION_MAX_AGE_MS } from '../../config/api';
import { ContentVersion } from '../../interfaces/api-responses';

/**
 * Marks an API GET that must not send the content version: one the API never
 * caches, such as the version itself or a logged-in read.
 */
export const UNVERSIONED = new HttpContextToken<boolean>(() => false);

/** Request context for a GET that skips contentVersionInterceptor. */
export const unversioned = (): HttpContext =>
	new HttpContext().set(UNVERSIONED, true);

/**
 * The site's content version, which changes on every edit. The API and
 * Cloudflare cache public reads under it, so an edit shows on the next page
 * load. Fetched on first use, then again once it's older than
 * CONTENT_VERSION_MAX_AGE_MS: once per request on the server, and in the
 * browser, which reuses the server's response while hydrating.
 */
@Injectable({
	providedIn: 'root'
})
export class ContentVersionService {
	private http = inject(HttpClient);
	private latest?: { version$: Observable<number>; fetchedAt: number };

	/**
	 * The current version, shared by every caller until it's too old. Its age
	 * is checked here rather than with a timer, which would keep the app from
	 * becoming stable (holding up server rendering and hydration). A failed
	 * fetch isn't kept: the next subscriber fetches it again.
	 */
	public version(): Observable<number> {
		const now = Date.now();
		if (
			!this.latest ||
			now - this.latest.fetchedAt > CONTENT_VERSION_MAX_AGE_MS
		) {
			this.latest = { version$: this.fetchVersion(), fetchedAt: now };
		}
		return this.latest.version$;
	}

	private fetchVersion(): Observable<number> {
		return this.http
			.get<ContentVersion>(`${environment.API_URL}/content/version`, {
				context: unversioned()
			})
			.pipe(
				map(({ version }) => version),
				shareReplay(1)
			);
	}
}
