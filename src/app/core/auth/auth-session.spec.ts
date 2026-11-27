import { STORAGE_KEYS } from '../browser-storage/browser-storage';
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
import { SessionUser } from '../api/api-responses';
import { UNVERSIONED } from '../api/content-version/content-version-cache';
import {
	AUTH_REFRESH_URL,
	authRefreshInterceptor
} from './auth-refresh-interceptor';
import { AuthSession, SessionEndReason } from './auth-session';

const ME_URL = `${environment.API_URL}/auth/me`;
const USER: SessionUser = { id: '1', username: 'editor' };
const UNAUTHORIZED = { status: 401, statusText: 'Unauthorized' };
const SERVER_ERROR = { status: 500, statusText: 'Server Error' };

describe('AuthSession', () => {
	let service: AuthSession;
	let controller: HttpTestingController;

	function setUp(platform = 'browser') {
		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(withInterceptors([authRefreshInterceptor])),
				provideHttpClientTesting(),
				{ provide: PLATFORM_ID, useValue: platform }
			]
		});
		service = TestBed.inject(AuthSession);
		controller = TestBed.inject(HttpTestingController);
	}

	function check() {
		const result: { user?: SessionUser | null } = {};
		service.checkSession().subscribe((user) => (result.user = user));
		return result;
	}

	const savedUser = () => localStorage.getItem(STORAGE_KEYS.savedUser);
	const saveUser = (user: SessionUser) =>
		localStorage.setItem(STORAGE_KEYS.savedUser, JSON.stringify(user));

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

	describe('reporting an ended session', () => {
		let reasons: SessionEndReason[];

		function setUpReporting() {
			setUp();
			reasons = [];
			service.sessionEnded.subscribe((reason) => reasons.push(reason));
		}

		it('reports an expired session once when the page-load check finds it over', () => {
			saveUser(USER);
			setUpReporting();
			check();
			controller.expectOne(ME_URL).flush(null, UNAUTHORIZED);
			controller.expectOne(AUTH_REFRESH_URL).flush(null, UNAUTHORIZED);

			expect(reasons).toEqual(['expired']);
		});

		it('reports nothing when nobody was logged in', () => {
			setUpReporting();
			check();
			controller.expectOne(ME_URL).flush(null, UNAUTHORIZED);
			controller.expectOne(AUTH_REFRESH_URL).flush(null, UNAUTHORIZED);

			expect(reasons).toEqual([]);
		});

		it('marks a logout pending before removing the user, so other tabs can tell it from an expiry', () => {
			setUpReporting();
			check();
			controller.expectOne(ME_URL).flush(USER);
			const pendingWhenRemoved: (string | null)[] = [];
			const removeItem = Storage.prototype.removeItem;
			vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(
				function (this: Storage, key: string) {
					if (key === STORAGE_KEYS.savedUser) {
						pendingWhenRemoved.push(
							this.getItem(STORAGE_KEYS.logoutPending)
						);
					}
					removeItem.call(this, key);
				}
			);

			service.logout();
			vi.restoreAllMocks();
			controller
				.expectOne(`${environment.API_URL}/auth/logout`)
				.flush(null, { status: 204, statusText: 'No Content' });

			expect(pendingWhenRemoved).toEqual(['true']);
		});

		it('reports nothing for a logout in this tab', () => {
			setUpReporting();
			check();
			controller.expectOne(ME_URL).flush(USER);
			service.logout();
			controller
				.expectOne(`${environment.API_URL}/auth/logout`)
				.flush(null, { status: 204, statusText: 'No Content' });

			expect(reasons).toEqual([]);
		});
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
		const isPending = () =>
			localStorage.getItem(STORAGE_KEYS.logoutPending);

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
			// Later checks reuse this page load's check, without asking again.
			expect(check().user).toBeNull();
			controller.expectNone(ME_URL);
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

		it.each([
			[
				'a network failure',
				{ status: 0, statusText: 'Unknown Error' },
				true
			],
			['a server error', SERVER_ERROR, true],
			[
				'a bad request',
				{ status: 400, statusText: 'Bad Request' },
				false
			],
			['a rate limit', { status: 429, statusText: 'Too Many' }, false],
			['a missing route', { status: 404, statusText: 'Not Found' }, false]
		])(
			'keeps the logout pending after %s only if retrying could help',
			(_, response, pending) => {
				signedIn();
				service.logout();
				controller.expectOne(LOGOUT_URL).flush(null, response);

				expect(isPending() !== null).toBe(pending);
			}
		);

		it('sends one request however often it is asked', () => {
			signedIn();
			service.logout();
			service.logout();
			service.finishLogout().subscribe();

			controller.expectOne(LOGOUT_URL).flush(null, NO_CONTENT);
		});

		it('ignores a session check that answers after logging out, even once the logout is done', () => {
			setUp();
			check();
			const staleCheck = controller.expectOne(ME_URL);
			service.logout();
			controller.expectOne(LOGOUT_URL).flush(null, NO_CONTENT);
			expect(isPending()).toBeNull();

			staleCheck.flush(USER);

			expect(service.user()).toBeNull();
			expect(savedUser()).toBeNull();
		});

		it('ignores a session check that fails after logging out, and asks nothing more', () => {
			setUp();
			saveUser(USER);
			check();
			const staleCheck = controller.expectOne(ME_URL);
			service.logout();
			controller.expectOne(LOGOUT_URL).flush(null, NO_CONTENT);

			// The API is down: it would otherwise restore the saved user and ask again.
			staleCheck.flush(null, SERVER_ERROR);

			expect(service.user()).toBeNull();
			expect(savedUser()).toBeNull();
			expect(check().user).toBeNull();
			controller.expectNone(ME_URL);
		});

		it('knows whether a user is saved', () => {
			setUp();
			expect(service.hasSavedUser()).toBe(false);

			saveUser(USER);

			expect(service.hasSavedUser()).toBe(true);
		});

		describe('while pending', () => {
			beforeEach(() =>
				localStorage.setItem(STORAGE_KEYS.logoutPending, 'true')
			);

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

			it('answers a session check at once, retrying the logout in the background', async () => {
				setUp();
				await Promise.resolve();
				controller.expectOne(LOGOUT_URL).flush(null, SERVER_ERROR);

				// Logged out before the request answers, so guards don't wait.
				const failed = check();
				const request = controller.expectOne(LOGOUT_URL);
				expect(failed.user).toBeNull();
				request.flush(null, SERVER_ERROR);
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

	describe('in other tabs', () => {
		const otherTab = (newValue: string | null) => {
			if (newValue) {
				localStorage.setItem(STORAGE_KEYS.savedUser, newValue);
			} else {
				localStorage.removeItem(STORAGE_KEYS.savedUser);
			}
			window.dispatchEvent(
				new StorageEvent('storage', {
					key: STORAGE_KEYS.savedUser,
					newValue
				})
			);
		};

		it('follows logins and logouts', () => {
			setUp();

			otherTab(JSON.stringify(USER));
			expect(service.user()).toEqual(USER);

			otherTab(null);
			expect(service.user()).toBeNull();
		});

		it('ignores a session check that answers after a logout there', () => {
			setUp();
			saveUser(USER);
			check();
			const staleCheck = controller.expectOne(ME_URL);

			otherTab(null);
			staleCheck.flush(USER);

			expect(service.user()).toBeNull();
			expect(savedUser()).toBeNull();
		});

		it('reports a logout there', () => {
			setUp();
			const reasons: SessionEndReason[] = [];
			service.sessionEnded.subscribe((reason) => reasons.push(reason));

			otherTab(JSON.stringify(USER));
			// logout() there marks the logout pending before removing the user.
			localStorage.setItem(STORAGE_KEYS.logoutPending, 'true');
			otherTab(null);

			expect(reasons).toEqual(['other-tab']);
		});

		it('reports the session expiring there as expired', () => {
			setUp();
			const reasons: SessionEndReason[] = [];
			service.sessionEnded.subscribe((reason) => reasons.push(reason));

			otherTab(JSON.stringify(USER));
			otherTab(null);

			expect(reasons).toEqual(['expired']);
		});

		it('reports nothing for a login there', () => {
			setUp();
			const reasons: SessionEndReason[] = [];
			service.sessionEnded.subscribe((reason) => reasons.push(reason));

			otherTab(JSON.stringify(USER));

			expect(reasons).toEqual([]);
		});
	});
});
