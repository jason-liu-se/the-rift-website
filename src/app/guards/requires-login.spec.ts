import { ActivatedRouteSnapshot, CanActivateFn, Route } from '@angular/router';
import { requireLoggedIn, requireLoggedOut } from './admin-auth.guards';
import { requiresLogin } from './requires-login';

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
