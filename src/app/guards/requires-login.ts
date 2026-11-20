import { ActivatedRouteSnapshot } from '@angular/router';
import { requireLoggedIn } from './admin-auth.guards';

/**
 * Whether the route, or any route above it, has `requireLoggedIn` in its
 * `canActivate` (other ways of protecting a route aren't looked at).
 */
export function requiresLogin(snapshot: ActivatedRouteSnapshot): boolean {
	return snapshot.pathFromRoot.some((route) =>
		route.routeConfig?.canActivate?.includes(requireLoggedIn)
	);
}
