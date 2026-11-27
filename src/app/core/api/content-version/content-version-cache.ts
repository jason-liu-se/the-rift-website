import {
	HttpClient,
	HttpContext,
	HttpContextToken
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CONTENT_VERSION_MAX_AGE_MS } from '../../config/api';
import { ContentVersion, DetailVersion } from '../api-responses';
import { TimedRequest, reuseUntilOld } from '../reuse-until-old';

/**
 * Marks an API GET that must not send the content version: one the API never
 * caches, such as the version itself or a logged-in read.
 */
export const UNVERSIONED = new HttpContextToken<boolean>(() => false);

/** Request context for a GET that skips contentVersionInterceptor. */
export const unversioned = (): HttpContext =>
	new HttpContext().set(UNVERSIONED, true);

/**
 * The site's content version, which changes on every edit, and the news
 * detail version, which changes when a scheduled post goes live. The API and
 * Cloudflare cache public reads under them, so an edit shows on the next page
 * load. Each is fetched on first use, then again once it's older than
 * CONTENT_VERSION_MAX_AGE_MS: once per request on the server, and in the
 * browser, which reuses the server's response while hydrating. A failed
 * fetch isn't kept, so the next caller fetches it again.
 */
@Injectable({
	providedIn: 'root'
})
export class ContentVersionCache {
	private http = inject(HttpClient);
	private latestVersion?: TimedRequest<number>;
	private latestNewsVersion?: TimedRequest<string>;

	/** The current content version (`v`), shared by every caller until it's too old. */
	public version(): Observable<number> {
		this.latestVersion = reuseUntilOld(
			this.latestVersion,
			CONTENT_VERSION_MAX_AGE_MS,
			() => this.fetchVersion<ContentVersion>('content/version')
		);
		return this.latestVersion.response$;
	}

	/** The current news detail version (`dv`), sent with `v` on news reads. */
	public newsDetailVersion(): Observable<string> {
		this.latestNewsVersion = reuseUntilOld(
			this.latestNewsVersion,
			CONTENT_VERSION_MAX_AGE_MS,
			() => this.fetchVersion<DetailVersion>('content/version/news')
		);
		return this.latestNewsVersion.response$;
	}

	private fetchVersion<T extends ContentVersion | DetailVersion>(
		path: string
	): Observable<T['version']> {
		return this.http
			.get<T>(`${environment.API_URL}/${path}`, {
				context: unversioned()
			})
			.pipe(
				map(({ version }) => version),
				shareReplay(1)
			);
	}
}
