import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ContentVersionService, UNVERSIONED } from './content-version.service';

/**
 * Sends the content version as `v` on every API GET, so no public read can
 * miss it (the API doesn't cache a read without it). Writes aren't GETs, and
 * uncached GETs opt out with `unversioned()`. If the version can't be fetched,
 * the read goes without `v`: uncached, so slower, but it still works.
 */
export const contentVersionInterceptor: HttpInterceptorFn = (req, next) => {
	if (
		req.method !== 'GET' ||
		!req.url.startsWith(`${environment.API_URL}/`) ||
		req.context.get(UNVERSIONED)
	) {
		return next(req);
	}

	return inject(ContentVersionService)
		.version()
		.pipe(
			catchError(() => of(undefined)),
			switchMap((version) =>
				next(
					version === undefined
						? req
						: req.clone({ setParams: { v: String(version) } })
				)
			)
		);
};
