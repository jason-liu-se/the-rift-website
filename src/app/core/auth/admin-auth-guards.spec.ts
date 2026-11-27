import { STORAGE_KEYS } from '../browser-storage/browser-storage';
import { TestBed } from '@angular/core/testing';
import {
	ActivatedRouteSnapshot,
	CanActivateFn,
	Router,
	RouterStateSnapshot,
	UrlTree,
	provideRouter
} from '@angular/router';
import { Observable, firstValueFrom, of } from 'rxjs';
import { routes } from '../../app.routes';
import { ADMIN_LOGIN_PATH, ADMIN_PATH } from '../config/admin';
import { AuthSession } from './auth-session';
import { requireLoggedIn, requireLoggedOut } from './admin-auth-guards';

describe('admin auth guards', () => {
	function runGuard(
		guard: CanActivateFn,
		loggedIn: boolean,
		url = ADMIN_PATH
	): Promise<boolean | UrlTree> {
		TestBed.configureTestingModule({
			providers: [
				provideRouter([]),
				{
					provide: AuthSession,
					useValue: {
						checkSession: () =>
							of(
								loggedIn
									? { id: '1', username: 'editor' }
									: null
							)
					}
				}
			]
		});
		const result = TestBed.runInInjectionContext(() =>
			guard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot)
		) as Observable<boolean | UrlTree>;
		return firstValueFrom(result);
	}

	const urlOf = (result: boolean | UrlTree) =>
		TestBed.inject(Router).serializeUrl(result as UrlTree);

	it.each([ADMIN_PATH, ADMIN_LOGIN_PATH])(
		'redirects to a real route (%s)',
		(path) => {
			expect(routes.some((route) => `/${route.path}` === path)).toBe(
				true
			);
		}
	);

	describe('requireLoggedIn', () => {
		beforeEach(() => sessionStorage.clear());

		it('returns a logged-in editor to the saved page, once', async () => {
			sessionStorage.setItem(STORAGE_KEYS.loginReturnUrl, '/admin#news');

			expect(urlOf(await runGuard(requireLoggedIn, true))).toBe(
				'/admin#news'
			);
			TestBed.resetTestingModule();
			expect(await runGuard(requireLoggedIn, true, '/admin#news')).toBe(
				true
			);
		});

		it("lets them in when the saved page is where they're going", async () => {
			sessionStorage.setItem(STORAGE_KEYS.loginReturnUrl, '/admin');

			expect(await runGuard(requireLoggedIn, true)).toBe(true);
		});

		it('keeps the saved page while nobody is logged in', async () => {
			sessionStorage.setItem(STORAGE_KEYS.loginReturnUrl, '/admin#news');

			expect(urlOf(await runGuard(requireLoggedIn, false))).toBe(
				ADMIN_LOGIN_PATH
			);
			expect(sessionStorage.getItem(STORAGE_KEYS.loginReturnUrl)).toBe(
				'/admin#news'
			);
		});

		it('lets a logged-in editor in', async () => {
			expect(await runGuard(requireLoggedIn, true)).toBe(true);
		});

		it('redirects to the login page when nobody is logged in', async () => {
			expect(urlOf(await runGuard(requireLoggedIn, false))).toBe(
				ADMIN_LOGIN_PATH
			);
		});
	});

	describe('requireLoggedOut', () => {
		it('redirects a logged-in editor to the admin page', async () => {
			expect(urlOf(await runGuard(requireLoggedOut, true))).toBe(
				ADMIN_PATH
			);
		});

		it('shows the login page when nobody is logged in', async () => {
			expect(await runGuard(requireLoggedOut, false)).toBe(true);
		});
	});
});
