import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import {
	HttpClient,
	provideHttpClient,
	withInterceptors
} from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import {
	SERVER_API_TIMEOUT_MS,
	serverApiTimeoutInterceptor
} from './server-api-timeout.interceptor';

describe('serverApiTimeoutInterceptor', () => {
	function requestTimeoutOn(platform: 'server' | 'browser') {
		TestBed.configureTestingModule({
			providers: [
				{ provide: PLATFORM_ID, useValue: platform },
				provideHttpClient(
					withInterceptors([serverApiTimeoutInterceptor])
				),
				provideHttpClientTesting()
			]
		});
		TestBed.inject(HttpClient).get('/api').subscribe();
		const request = TestBed.inject(HttpTestingController).expectOne('/api');
		return request.request.timeout;
	}

	it('sets a timeout on server requests', () => {
		expect(requestTimeoutOn('server')).toBe(SERVER_API_TIMEOUT_MS);
	});

	it('leaves browser requests without a timeout', () => {
		expect(requestTimeoutOn('browser')).toBeUndefined();
	});
});
