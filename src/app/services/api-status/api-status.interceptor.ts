import {
	HttpErrorResponse,
	HttpInterceptorFn,
	HttpResponse
} from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_HEALTH_URL, ApiStatusService } from './api-status.service';

/** Only a health check, which skips the browser's cache, proves the API is up. */
function respond(status: ApiStatusService, url: string): void {
	if (url === API_HEALTH_URL) {
		status.reportUp();
	} else {
		status.reportResponse();
	}
}

/**
 * Tells ApiStatusService whether each API request got through: down after a
 * network error (status 0, which includes a timeout) or a 5xx. Any response
 * (a 4xx included) means the API is up only if it answers a health check; see
 * `respond`. Listed before the other interceptors, so a request that fails, is
 * refreshed and retried successfully counts as a response, not a failure.
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
					respond(status, req.url);
				}
			},
			error: (error: unknown) => {
				if (!(error instanceof HttpErrorResponse)) {
					return;
				}
				if (error.status === 0 || error.status >= 500) {
					status.reportDown();
				} else {
					respond(status, req.url);
				}
			}
		})
	);
};
