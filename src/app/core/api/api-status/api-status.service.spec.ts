import { STORAGE_KEYS } from '../../browser-storage/browser-storage.service';
import { HttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { API_HEALTH_CHECK_INTERVAL_MS } from '../../config/api';
import { UNVERSIONED } from '../content-version/content-version.service';
import { apiStatusInterceptor } from './api-status.interceptor';
import { ApiStatusService } from './api-status.service';

const HEALTH_URL = `${environment.API_URL}/health`;
const NEWS_URL = `${environment.API_URL}/news`;

describe('ApiStatusService', () => {
	let service: ApiStatusService;
	let http: HttpClient;
	let controller: HttpTestingController;

	function setup(platform: 'browser' | 'server' = 'browser'): void {
		TestBed.configureTestingModule({
			providers: [
				{ provide: PLATFORM_ID, useValue: platform },
				provideHttpClient(withInterceptors([apiStatusInterceptor])),
				provideHttpClientTesting()
			]
		});
		service = TestBed.inject(ApiStatusService);
		http = TestBed.inject(HttpClient);
		controller = TestBed.inject(HttpTestingController);
	}

	const send = (url = NEWS_URL) =>
		http.get(url).subscribe({ error: () => undefined });
	const answer = (status: number, url = NEWS_URL) =>
		controller.expectOne(url).flush(null, { status, statusText: 'x' });
	const setVisibility = (state: 'visible' | 'hidden') => {
		vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(state);
		document.dispatchEvent(new Event('visibilitychange'));
	};
	const advance = (ms: number) => vi.advanceTimersByTimeAsync(ms);

	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	describe('status from API responses', () => {
		beforeEach(() => setup());

		it('starts up', () => {
			expect(service.status()).toBe('up');
		});

		it('is down after a 5xx response', () => {
			send();
			answer(503);

			expect(service.status()).toBe('down');
		});

		it('is down after a network error', () => {
			send();
			controller.expectOne(NEWS_URL).error(new ProgressEvent('error'));

			expect(service.status()).toBe('down');
		});

		it('stays up after a 4xx response', () => {
			send();
			answer(404);

			expect(service.status()).toBe('up');
		});

		it('is up again once a health check gets any answer', async () => {
			send();
			answer(500);

			await advance(API_HEALTH_CHECK_INTERVAL_MS);
			answer(401, HEALTH_URL);

			expect(service.status()).toBe('up');
		});

		it('ignores requests to other hosts', () => {
			send('https://example.com/data');
			controller
				.expectOne('https://example.com/data')
				.error(new ProgressEvent('error'));

			expect(service.status()).toBe('up');
		});
	});

	describe('health checks while down', () => {
		beforeEach(() => {
			setup();
			send();
			answer(500);
		});

		it('checks /health every interval, without the content version, until it answers', async () => {
			controller.expectNone(HEALTH_URL);

			await advance(API_HEALTH_CHECK_INTERVAL_MS);
			const first = controller.expectOne(HEALTH_URL);
			expect(first.request.context.get(UNVERSIONED)).toBe(true);
			first.flush(null, { status: 502, statusText: 'Bad Gateway' });
			expect(service.status()).toBe('down');

			await advance(API_HEALTH_CHECK_INTERVAL_MS);
			controller.expectOne(HEALTH_URL).flush({});
			expect(service.status()).toBe('up');

			await advance(API_HEALTH_CHECK_INTERVAL_MS * 3);
			controller.expectNone(HEALTH_URL);
		});

		it('asks the API, not the browser cache, and stays down on another response until it answers', async () => {
			send();
			answer(200);
			await advance(0);

			// A response may come from the browser's cache: check at once.
			const check = controller.expectOne(HEALTH_URL);
			expect(check.request.cache).toBe('no-store');
			expect(service.status()).toBe('down');

			check.flush({});
			expect(service.status()).toBe('up');
		});

		it('does not pile up checks when several responses arrive together', async () => {
			send();
			answer(200);
			send();
			answer(404);
			await advance(0);

			expect(controller.match(HEALTH_URL)).toHaveLength(1);
		});

		it('pauses while the tab is hidden and checks at once when it is visible again', async () => {
			setVisibility('hidden');
			await advance(API_HEALTH_CHECK_INTERVAL_MS * 3);
			controller.expectNone(HEALTH_URL);

			setVisibility('visible');
			await advance(0);
			controller.expectOne(HEALTH_URL);
		});

		it('checks at once when the browser comes back online', async () => {
			window.dispatchEvent(new Event('online'));
			await advance(0);

			controller.expectOne(HEALTH_URL);
		});

		it('does not check while the browser is offline, and checks at once when it is back', async () => {
			window.dispatchEvent(new Event('offline'));
			await advance(API_HEALTH_CHECK_INTERVAL_MS * 3);
			controller.expectNone(HEALTH_URL);

			window.dispatchEvent(new Event('online'));
			await advance(0);
			controller.expectOne(HEALTH_URL);
		});

		it('does not start a check while one is still running', async () => {
			await advance(API_HEALTH_CHECK_INTERVAL_MS);
			await advance(API_HEALTH_CHECK_INTERVAL_MS);

			expect(controller.match(HEALTH_URL)).toHaveLength(1);
		});
	});

	describe('offline', () => {
		beforeEach(() => setup());

		it('follows the offline and online events', () => {
			window.dispatchEvent(new Event('offline'));
			expect(service.status()).toBe('offline');

			window.dispatchEvent(new Event('online'));
			expect(service.status()).toBe('up');
		});

		it('is down, not up, when it comes back online while the API is still down', () => {
			send();
			answer(500);
			window.dispatchEvent(new Event('offline'));
			expect(service.status()).toBe('offline');

			window.dispatchEvent(new Event('online'));
			expect(service.status()).toBe('down');
		});
	});

	describe('retrying a pending logout', () => {
		const LOGOUT_URL = `${environment.API_URL}/auth/logout`;

		beforeEach(() => setup());
		afterEach(() => localStorage.clear());

		it('sends it once when the API comes back after being down', async () => {
			send();
			answer(500);
			TestBed.tick();
			localStorage.setItem(STORAGE_KEYS.logoutPending, 'true');

			await advance(API_HEALTH_CHECK_INTERVAL_MS);
			answer(200, HEALTH_URL);
			TestBed.tick();

			controller.expectOne(LOGOUT_URL).flush(null);
			expect(localStorage.getItem(STORAGE_KEYS.logoutPending)).toBeNull();
		});

		it('sends it once when the browser comes back online', () => {
			window.dispatchEvent(new Event('offline'));
			TestBed.tick();
			localStorage.setItem(STORAGE_KEYS.logoutPending, 'true');

			window.dispatchEvent(new Event('online'));
			TestBed.tick();

			controller.expectOne(LOGOUT_URL).flush(null);
		});

		it('sends nothing when no logout is pending', async () => {
			send();
			answer(500);
			TestBed.tick();
			await advance(API_HEALTH_CHECK_INTERVAL_MS);
			answer(200, HEALTH_URL);
			TestBed.tick();

			controller.expectNone(LOGOUT_URL);
		});
	});

	it('stays up on the server, even after failures', async () => {
		setup('server');
		send();
		answer(500);
		await advance(API_HEALTH_CHECK_INTERVAL_MS);

		expect(service.status()).toBe('up');
		controller.expectNone(HEALTH_URL);
	});
});
