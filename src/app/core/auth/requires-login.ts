import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { requireLoggedIn } from './admin-auth-guards';

/**
 * Whether the route, or any route above it, has `requireLoggedIn` in its
 * `canActivate` (other ways of protecting a route aren't looked at).
 */
export function requiresLogin(snapshot: ActivatedRouteSnapshot): boolean {
	return snapshot.pathFromRoot.some((route) =>
		route.routeConfig?.canActivate?.includes(requireLoggedIn)
	);
}

/** Whether the page the user is on requires a login (`false` before the first one). */
export function isOnProtectedPage(router: Router): boolean {
	let route = router.routerState.snapshot.root;
	while (route.firstChild) {
		route = route.firstChild;
	}
	return requiresLogin(route);
}
