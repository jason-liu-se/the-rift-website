import {
	HttpClient,
	provideHttpClient,
	withInterceptors
} from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { SessionUser } from '../../interfaces/api-responses';
import { UNVERSIONED } from '../content-version/content-version.service';
import {
	AUTH_REFRESH_URL,
	authRefreshInterceptor
} from './auth-refresh.interceptor';
import {
	AuthService,
	LOGOUT_PENDING_KEY,
	SAVED_USER_KEY
} from './auth.service';

const ME_URL = `${environment.API_URL}/auth/me`;
const USER: SessionUser = { id: '1', username: 'editor' };
const UNAUTHORIZED = { status: 401, statusText: 'Unauthorized' };
const SERVER_ERROR = { status: 500, statusText: 'Server Error' };

describe('AuthService', () => {
	let service: AuthService;
	let controller: HttpTestingController;

	function setUp(platform = 'browser') {
		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(withInterceptors([authRefreshInterceptor])),
				provideHttpClientTesting(),
				{ provide: PLATFORM_ID, useValue: platform }
			]
		});
		service = TestBed.inject(AuthService);
		controller = TestBed.inject(HttpTestingController);
	}

	function check() {
		const result: { user?: SessionUser | null } = {};
		service.checkSession().subscribe((user) => (result.user = user));
		return result;
	}

	const savedUser = () => localStorage.getItem(SAVED_USER_KEY);
	const saveUser = (user: SessionUser) =>
		localStorage.setItem(SAVED_USER_KEY, JSON.stringify(user));

	// Before each test, so a failed test's saved user can't leak into the next.
	beforeEach(() => localStorage.clear());
	afterEach(() => controller.verify());

	it('links to the Discord login', () => {
		setUp();
		expect(service.loginUrl).toBe(`${environment.API_URL}/auth/discord`);
	});

	it('is unknown until the session is checked', () => {
		setUp();
		expect(service.user()).toBeUndefined();
	});

	it('checks the session once with the session cookies, unversioned', () => {
		setUp();
		const first = check();
		const second = check();

		const request = controller.expectOne(ME_URL);
		expect(request.request.withCredentials).toBe(true);
		expect(request.request.context.get(UNVERSIONED)).toBe(true);
		request.flush(USER);
		const later = check();
		controller.expectNone(ME_URL);

		expect([first.user, second.user, later.user]).toEqual([
			USER,
			USER,
			USER
		]);
		expect(service.user()).toEqual(USER);
		expect(JSON.parse(savedUser()!)).toEqual(USER);
	});

	it('is logged out when the session is over', () => {
		setUp();
		saveUser(USER);
		const result = check();
		controller.expectOne(ME_URL).flush(null, UNAUTHORIZED);
		controller.expectOne(AUTH_REFRESH_URL).flush(null, UNAUTHORIZED);

		expect(result.user).toBeNull();
		expect(service.user()).toBeNull();
		expect(savedUser()).toBeNull();
		// A definite answer: later checks don't ask again.
		expect(check().user).toBeNull();
		controller.expectNone(ME_URL);
	});

	it('stays logged in when an expired access token is refreshed', () => {
		setUp();
		const result = check();
		controller.expectOne(ME_URL).flush(null, UNAUTHORIZED);
		controller
			.expectOne(AUTH_REFRESH_URL)
			.flush(null, { status: 204, statusText: 'No Content' });
		controller.expectOne(ME_URL).flush(USER);

		expect(result.user).toEqual(USER);
		expect(service.user()).toEqual(USER);
		expect(JSON.parse(savedUser()!)).toEqual(USER);
	});

	it('logs out when any logged-in request finds the session is over', () => {
		setUp();
		check();
		controller.expectOne(ME_URL).flush(USER);
		const editUrl = `${environment.API_URL}/news`;
		TestBed.inject(HttpClient)
			.post(editUrl, null, { withCredentials: true })
			.subscribe({ error: () => undefined });
		controller.expectOne(editUrl).flush(null, UNAUTHORIZED);
		controller.expectOne(AUTH_REFRESH_URL).flush(null, UNAUTHORIZED);

		expect(service.user()).toBeNull();
		expect(savedUser()).toBeNull();
		expect(check().user).toBeNull();
		controller.expectNone(ME_URL);
	});

	it('keeps the last-known user while the API is down, and checks again next time', () => {
		setUp();
		saveUser(USER);
		const result = check();
		controller.expectOne(ME_URL).flush(null, SERVER_ERROR);

		expect(result.user).toEqual(USER);
		expect(service.user()).toEqual(USER);

		check();
		controller.expectOne(ME_URL).flush(USER);
	});

	it('keeps the last-known user when the refresh fails because the API is down', () => {
		setUp();
		saveUser(USER);
		const result = check();
		controller.expectOne(ME_URL).flush(null, UNAUTHORIZED);
		controller.expectOne(AUTH_REFRESH_URL).flush(null, SERVER_ERROR);

		expect(result.user).toEqual(USER);
		expect(savedUser()).not.toBeNull();
	});

	it('is logged out while the API is down if nobody logged in before', () => {
		setUp();
		const result = check();
		controller.expectOne(ME_URL).flush(null, SERVER_ERROR);

		expect(result.user).toBeNull();
	});

	it('never checks on the server, which leaves the user unknown', () => {
		setUp('server');
		expect(check().user).toBeNull();
		expect(service.user()).toBeUndefined();
	});

	describe('logging out', () => {
		const LOGOUT_URL = `${environment.API_URL}/auth/logout`;
		const NO_CONTENT = { status: 204, statusText: 'No Content' };
		const isPending = () => localStorage.getItem(LOGOUT_PENDING_KEY);

		function signedIn() {
			setUp();
			check();
			controller.expectOne(ME_URL).flush(USER);
		}

		it('clears the user at once, then tells the API with the session cookies', () => {
			signedIn();
			service.logout();

			expect(service.user()).toBeNull();
			expect(savedUser()).toBeNull();
			expect(isPending()).not.toBeNull();
			const request = controller.expectOne(LOGOUT_URL);
			expect(request.request.method).toBe('POST');
			expect(request.request.withCredentials).toBe(true);

			request.flush(null, NO_CONTENT);

			expect(isPending()).toBeNull();
			expect(service.isLogoutPending()).toBe(false);
			// Later checks ask the API again.
			check();
			controller.expectOne(ME_URL).flush(null, UNAUTHORIZED);
			controller.expectOne(AUTH_REFRESH_URL).flush(null, UNAUTHORIZED);
		});

		it('logs out locally and keeps the logout pending when the API is down', () => {
			signedIn();
			service.logout();
			controller.expectOne(LOGOUT_URL).flush(null, SERVER_ERROR);

			expect(service.user()).toBeNull();
			expect(savedUser()).toBeNull();
			expect(isPending()).not.toBeNull();
		});

		it('counts a logout the session had already ended (401) as done', () => {
			signedIn();
			service.logout();
			controller.expectOne(LOGOUT_URL).flush(null, UNAUTHORIZED);
			controller.expectOne(AUTH_REFRESH_URL).flush(null, UNAUTHORIZED);

			expect(isPending()).toBeNull();
		});

		it('sends one request however often it is asked', () => {
			signedIn();
			service.logout();
			service.logout();
			service.finishLogout().subscribe();

			controller.expectOne(LOGOUT_URL).flush(null, NO_CONTENT);
		});

		it('ignores a session check that answers after logging out', () => {
			setUp();
			check();
			service.logout();
			controller.expectOne(LOGOUT_URL).flush(null, SERVER_ERROR);
			controller.expectOne(ME_URL).flush(USER);

			expect(service.user()).toBeNull();
			expect(savedUser()).toBeNull();
		});

		describe('while pending', () => {
			beforeEach(() => localStorage.setItem(LOGOUT_PENDING_KEY, 'true'));

			it('retries once when the app starts, with the session cookies', async () => {
				setUp();
				await Promise.resolve();

				const request = controller.expectOne(LOGOUT_URL);
				expect(request.request.withCredentials).toBe(true);
				request.flush(null, NO_CONTENT);
				expect(isPending()).toBeNull();
			});

			it('does not retry on the server', async () => {
				setUp('server');
				await Promise.resolve();
				controller.expectNone(LOGOUT_URL);
			});

			it('checks the session by retrying the logout, and is logged out either way', async () => {
				setUp();
				await Promise.resolve();
				controller.expectOne(LOGOUT_URL).flush(null, SERVER_ERROR);

				const failed = check();
				controller.expectOne(LOGOUT_URL).flush(null, SERVER_ERROR);
				expect(failed.user).toBeNull();
				expect(isPending()).not.toBeNull();

				const succeeded = check();
				controller.expectOne(LOGOUT_URL).flush(null, NO_CONTENT);
				expect(succeeded.user).toBeNull();
				expect(isPending()).toBeNull();
				controller.expectNone(ME_URL);
			});

			it('shares one retry between the start-up retry and a session check', () => {
				setUp();
				const result = check();

				controller.expectOne(LOGOUT_URL).flush(null, NO_CONTENT);

				expect(result.user).toBeNull();
			});

			it('uses /auth/me again once the logout went through', async () => {
				setUp();
				await Promise.resolve();
				controller.expectOne(LOGOUT_URL).flush(null, NO_CONTENT);

				check();
				controller.expectOne(ME_URL).flush(USER);
				expect(service.user()).toEqual(USER);
			});

			it('retries when the browser comes back online', async () => {
				setUp();
				await Promise.resolve();
				controller.expectOne(LOGOUT_URL).flush(null, SERVER_ERROR);

				window.dispatchEvent(new Event('online'));

				controller.expectOne(LOGOUT_URL).flush(null, NO_CONTENT);
				expect(isPending()).toBeNull();
			});

			it('sends nothing on coming online once it is done', async () => {
				setUp();
				await Promise.resolve();
				controller.expectOne(LOGOUT_URL).flush(null, NO_CONTENT);

				window.dispatchEvent(new Event('online'));

				controller.expectNone(LOGOUT_URL);
			});
		});
	});

	it('follows logins and logouts in other tabs', () => {
		setUp();
		const otherTab = (newValue: string | null) => {
			if (newValue) {
				localStorage.setItem(SAVED_USER_KEY, newValue);
			} else {
				localStorage.removeItem(SAVED_USER_KEY);
			}
			window.dispatchEvent(
				new StorageEvent('storage', { key: SAVED_USER_KEY, newValue })
			);
		};

		otherTab(JSON.stringify(USER));
		expect(service.user()).toEqual(USER);

		otherTab(null);
		expect(service.user()).toBeNull();
	});
});
