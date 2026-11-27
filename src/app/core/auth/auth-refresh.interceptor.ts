import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService, isUnauthorized } from './auth.service';

export const AUTH_REFRESH_URL = `${environment.API_URL}/auth/refresh`;

/**
 * Access tokens expire after a few minutes. When an authenticated API request
 * (one sent `withCredentials`) answers 401, this trades the refresh token for a
 * new access token once and retries the request. If the refresh answers 401,
 * the session is over: AuthService logs out and the request's own 401 goes to
 * the caller. Any other refresh failure (the API is down) goes to the caller
 * instead, so it isn't mistaken for a logout.
 * Concurrent refreshes are safe: the API answers them all with the same tokens.
 */
export const authRefreshInterceptor: HttpInterceptorFn = (req, next) => {
	if (
		!req.withCredentials ||
		!req.url.startsWith(`${environment.API_URL}/`) ||
		req.url === AUTH_REFRESH_URL
	) {
		return next(req);
	}

	const http = inject(HttpClient);
	const auth = inject(AuthService);
	return next(req).pipe(
		catchError((error: unknown) => {
			if (!isUnauthorized(error)) {
				return throwError(() => error);
			}
			return http
				.post<void>(AUTH_REFRESH_URL, null, { withCredentials: true })
				.pipe(
					catchError((refreshError: unknown) => {
						if (!isUnauthorized(refreshError)) {
							return throwError(() => refreshError);
						}
						auth.markLoggedOut();
						return throwError(() => error);
					}),
					switchMap(() => next(req))
				);
		})
	);
};
