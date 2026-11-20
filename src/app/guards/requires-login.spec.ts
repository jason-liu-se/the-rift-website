import { TestBed } from '@angular/core/testing';
import {
	ActivatedRouteSnapshot,
	CanActivateFn,
	Route,
	Router,
	provideRouter
} from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';
import { requireLoggedIn, requireLoggedOut } from './admin-auth.guards';
import { isOnProtectedPage, requiresLogin } from './requires-login';

/** A route snapshot whose ancestors (root first) and itself use these configs. */
function snapshotOf(...configs: (Route | null)[]): ActivatedRouteSnapshot {
	return {
		pathFromRoot: configs.map((routeConfig) => ({ routeConfig }))
	} as unknown as ActivatedRouteSnapshot;
}

const guarded = (...guards: CanActivateFn[]): Route => ({
	canActivate: guards
});

describe('requiresLogin', () => {
	it('is false for a route with no guards', () => {
		expect(requiresLogin(snapshotOf(null, {}))).toBe(false);
	});

	it('is false for a route with only another guard', () => {
		expect(requiresLogin(snapshotOf(null, guarded(requireLoggedOut)))).toBe(
			false
		);
	});

	it('is true for a route with requireLoggedIn', () => {
		expect(
			requiresLogin(
				snapshotOf(null, guarded(requireLoggedOut, requireLoggedIn))
			)
		).toBe(true);
	});

	it('is true for a child of a route with requireLoggedIn', () => {
		expect(
			requiresLogin(snapshotOf(null, guarded(requireLoggedIn), {}))
		).toBe(true);
	});
});

describe('isOnProtectedPage', () => {
	function setUp() {
		TestBed.configureTestingModule({
			providers: [
				provideRouter([
					{ path: 'public', children: [] },
					{
						path: 'protected',
						canActivate: [requireLoggedIn],
						children: [{ path: '', children: [] }]
					}
				]),
				{
					provide: AuthService,
					useValue: {
						checkSession: () => of({ id: '1', username: 'editor' })
					}
				}
			]
		});
		return TestBed.inject(Router);
	}

	it('is false before the first navigation', () => {
		expect(isOnProtectedPage(setUp())).toBe(false);
	});

	it('is false on a public page', async () => {
		const router = setUp();
		await router.navigateByUrl('/public');
		expect(isOnProtectedPage(router)).toBe(false);
	});

	it('is true on a page under requireLoggedIn', async () => {
		const router = setUp();
		await router.navigateByUrl('/protected');
		expect(isOnProtectedPage(router)).toBe(true);
	});
});
