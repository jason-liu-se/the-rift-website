import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * How each route in app.routes.ts is rendered. Every route must match an entry
 * here (`*` matches one path segment); anything unmatched falls through to the
 * 404 entry at the end.
 */
export const serverRoutes: ServerRoute[] = [
	// Static content: rendered once at build time and served as files.
	{ path: '', renderMode: RenderMode.Prerender },
	{ path: 'about', renderMode: RenderMode.Prerender },
	{ path: 'join', renderMode: RenderMode.Prerender },
	{ path: 'contact', renderMode: RenderMode.Prerender },
	{ path: 'map', renderMode: RenderMode.Prerender },
	// Only the page around the BlueMap iframe; the map loads in the browser.
	{ path: 'map/*', renderMode: RenderMode.Prerender },
	// API data: rendered on each request, so new content appears straight away.
	{ path: 'news', renderMode: RenderMode.Server },
	{ path: 'gallery', renderMode: RenderMode.Server },
	{ path: 'gallery/*', renderMode: RenderMode.Server },
	{ path: 'downloads', renderMode: RenderMode.Server },
	// Unknown URLs: the app's error page, with a real 404 status.
	{ path: '**', renderMode: RenderMode.Server, status: 404 }
];
