import {
	HttpErrorResponse,
	HttpInterceptorFn,
	HttpResponse
} from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiStatusService } from './api-status.service';

/**
 * Tells ApiStatusService whether each API request got through: down after a
 * network error (status 0, which includes a timeout) or a 5xx, up after any
 * other response, a 4xx included. Listed before the other interceptors, so a
 * request that fails, is refreshed and retried successfully counts as up.
 */
export const apiStatusInterceptor: HttpInterceptorFn = (req, next) => {
	if (!req.url.startsWith(`${environment.API_URL}/`)) {
		return next(req);
	}

	const status = inject(ApiStatusService);
	return next(req).pipe(
		tap({
			next: (event) => {
				if (event instanceof HttpResponse) {
					status.reportUp();
				}
			},
			error: (error: unknown) => {
				if (!(error instanceof HttpErrorResponse)) {
					return;
				}
				if (error.status === 0 || error.status >= 500) {
					status.reportDown();
				} else {
					status.reportUp();
				}
			}
		})
	);
};
