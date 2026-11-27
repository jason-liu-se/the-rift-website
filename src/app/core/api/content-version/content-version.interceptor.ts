import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import {
	Observable,
	catchError,
	combineLatest,
	map,
	of,
	switchMap
} from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ContentVersionService, UNVERSIONED } from './content-version.service';

const NEWS_URL = `${environment.API_URL}/news`;

/**
 * Sends the content version as `v` on every API GET, so no public read can
 * miss it (the API doesn't cache a read without it), and on news reads the
 * news detail version as `dv` too, so a scheduled post shows once it goes
 * live. Writes aren't GETs, and uncached GETs opt out with `unversioned()`. If
 * a version can't be fetched, the read goes without it: uncached, so slower,
 * but it still works.
 */
export const contentVersionInterceptor: HttpInterceptorFn = (req, next) => {
	if (
		req.method !== 'GET' ||
		!req.url.startsWith(`${environment.API_URL}/`) ||
		req.context.get(UNVERSIONED)
	) {
		return next(req);
	}
	return versionParams(req).pipe(
		switchMap((params) => next(req.clone({ setParams: params })))
	);
};

/** The `v` (and for news, `dv`) to send, leaving out any that failed. */
function versionParams(
	req: HttpRequest<unknown>
): Observable<Record<string, string>> {
	const versions = inject(ContentVersionService);
	const orNothing = <T>(version$: Observable<T>) =>
		version$.pipe(catchError(() => of(undefined)));
	const isNewsRead =
		req.url === NEWS_URL || req.url.startsWith(`${NEWS_URL}/`);
	return combineLatest([
		orNothing(versions.version()),
		isNewsRead ? orNothing(versions.newsDetailVersion()) : of(undefined)
	]).pipe(
		map(([version, detailVersion]) => ({
			...(version !== undefined && { v: String(version) }),
			...(detailVersion !== undefined && { dv: detailVersion })
		}))
	);
}
