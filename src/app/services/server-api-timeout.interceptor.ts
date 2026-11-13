import { HttpInterceptorFn } from '@angular/common/http';
import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { SERVER_API_TIMEOUT_MS } from '../config/api';

/**
 * Stops a slow API from holding up server-rendered pages: after the timeout the
 * request fails, the page renders without that data, and the browser fetches
 * it again after hydration. Browser requests are left alone.
 */
export const serverApiTimeoutInterceptor: HttpInterceptorFn = (req, next) =>
	isPlatformServer(inject(PLATFORM_ID))
		? next(req.clone({ timeout: SERVER_API_TIMEOUT_MS }))
		: next(req);
