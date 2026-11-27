import { RenderMode, ServerRoute } from '@angular/ssr';
import { Route } from '@angular/router';
import { routes } from './app.routes';
import { NOINDEX_HEADERS } from './core/config/admin';

const RENDER_MODES = {
	prerender: RenderMode.Prerender,
	server: RenderMode.Server,
	client: RenderMode.Client
} as const;

/** How each route in app.routes.ts is rendered, from its `data.renderMode`. */
export const serverRoutes = routes.flatMap(toServerRoutes) as ServerRoute[];

/**
 * A route's entries: path parameters become `*`, a route with child routes
 * also covers everything under it, and the catch-all answers 404.
 */
function toServerRoutes(route: Route): ServerRoute[] {
	const path = (route.path ?? '').replace(/:[^/]+/g, '*');
	const mode = route.data?.['renderMode'] as keyof typeof RENDER_MODES;
	const entry = {
		path,
		renderMode: RENDER_MODES[mode],
		...(path === '**' && { status: 404 }),
		// A browser-only page's robots meta tag comes too late for crawlers
		// that don't run JavaScript.
		...(mode === 'client' &&
			route.data?.['noindex'] && { headers: NOINDEX_HEADERS })
	} as ServerRoute;
	const hasChildren = !!(route.children || route.loadChildren);
	return hasChildren ? [entry, { ...entry, path: `${path}/**` }] : [entry];
}
