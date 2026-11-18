import {
	HttpErrorResponse,
	HttpEventType,
	HttpInterceptorFn
} from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { tap } from 'rxjs';
import { OfflineBannerService } from './offline-banner.service';

/**
 * Tells OfflineBannerService about browser requests that couldn't reach a
 * server (status 0) and ones that got a response, even an error. Server
 * requests are left alone: a slow API there isn't the visitor's connection.
 */
export const connectivityInterceptor: HttpInterceptorFn = (req, next) => {
	if (!isPlatformBrowser(inject(PLATFORM_ID))) {
		return next(req);
	}
	const connectivity = inject(OfflineBannerService);
	return next(req).pipe(
		tap({
			next: (event) => {
				if (event.type === HttpEventType.Response) {
					connectivity.reportOnline();
				}
			},
			error: (error: unknown) =>
				error instanceof HttpErrorResponse && error.status === 0
					? connectivity.reportOffline()
					: connectivity.reportOnline()
		})
	);
};
