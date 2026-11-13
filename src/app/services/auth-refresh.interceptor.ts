import {
	HttpClient,
	HttpErrorResponse,
	HttpInterceptorFn,
	HttpStatusCode
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export const AUTH_REFRESH_URL = `${environment.API_URL}/auth/refresh`;

/**
 * Access tokens expire after a few minutes. When an authenticated API request
 * (one sent `withCredentials`) answers 401, this trades the refresh token for a
 * new access token once and retries the request. If the refresh fails too, the
 * request's own 401 goes to the caller, which sends the user to log in.
 * Concurrent refreshes are safe: the API answers them all with the same tokens.
 */
export const authRefreshInterceptor: HttpInterceptorFn = (req, next) => {
	if (
		!req.withCredentials ||
		!req.url.startsWith(environment.API_URL) ||
		req.url === AUTH_REFRESH_URL
	) {
		return next(req);
	}

	const http = inject(HttpClient);
	return next(req).pipe(
		catchError((error: unknown) => {
			if (
				!(error instanceof HttpErrorResponse) ||
				error.status !== HttpStatusCode.Unauthorized
			) {
				return throwError(() => error);
			}
			return http
				.post<void>(AUTH_REFRESH_URL, null, { withCredentials: true })
				.pipe(
					catchError(() => throwError(() => error)),
					switchMap(() => next(req))
				);
		})
	);
};
