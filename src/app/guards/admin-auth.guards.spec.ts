import { TestBed } from '@angular/core/testing';
import {
	ActivatedRouteSnapshot,
	CanActivateFn,
	Router,
	RouterStateSnapshot,
	UrlTree,
	provideRouter
} from '@angular/router';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { routes } from '../app.routes';
import { ADMIN_LOGIN_PATH, ADMIN_PATH } from '../config/admin';
import { AuthService } from '../services/auth.service';
import { requireLoggedIn, requireLoggedOut } from './admin-auth.guards';

describe('admin auth guards', () => {
	function runGuard(
		guard: CanActivateFn,
		loggedIn: boolean
	): Promise<boolean | UrlTree> {
		TestBed.configureTestingModule({
			providers: [
				provideRouter([]),
				{
					provide: AuthService,
					useValue: {
						getMe: () =>
							loggedIn
								? of({ id: '1', username: 'editor' })
								: throwError(() => new Error('401'))
					}
				}
			]
		});
		const result = TestBed.runInInjectionContext(() =>
			guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
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
