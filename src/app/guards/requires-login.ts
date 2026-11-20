import { ActivatedRouteSnapshot } from '@angular/router';
import { requireLoggedIn } from './admin-auth.guards';

/** Whether the route, or any route above it, needs a logged-in editor. */
export function requiresLogin(snapshot: ActivatedRouteSnapshot): boolean {
	return snapshot.pathFromRoot.some((route) =>
		route.routeConfig?.canActivate?.includes(requireLoggedIn)
	);
}
