import { HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';

/**
 * Subscribes to `source`, checks it sent exactly one GET to exactly `url`
 * (query string included, so renamed or extra parameters fail), answers with
 * `response`, and returns what the subscriber received.
 */
export function expectGet<T extends object>(
	source: Observable<T>,
	url: string,
	response: T
): T | undefined {
	let result: T | undefined;
	source.subscribe((data) => (result = data));

	const request = TestBed.inject(HttpTestingController).expectOne(url);
	expect(request.request.method).toBe('GET');
	request.flush(response);

	return result;
}

/**
 * Subscribes to `source`, answers its request to `url` with a server error,
 * and returns the error the subscriber received.
 */
export function flushServerError(
	source: Observable<unknown>,
	url: string
): HttpErrorResponse | undefined {
	let error: HttpErrorResponse | undefined;
	source.subscribe({ error: (e: HttpErrorResponse) => (error = e) });

	TestBed.inject(HttpTestingController)
		.expectOne(url)
		.flush(null, { status: 500, statusText: 'Server Error' });

	return error;
}
