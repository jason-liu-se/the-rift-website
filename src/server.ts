// Server entry: serves prerendered pages and renders server routes on request
// (render modes in src/app/app.routes.server.ts). Uses web-standard
// Request/Response, so it runs on Cloudflare Workers as well as the Angular
// dev server, which calls `reqHandler`.
import { AngularAppEngine, createRequestHandler } from '@angular/ssr';
import { environment } from './environments/environment';

// Requests for other hostnames are rejected, to prevent server-side request
// forgery through the Host header. The dev server skips this check.
const angularApp = new AngularAppEngine({
	allowedHosts: [new URL(environment.SITE_URL).hostname]
});

export const reqHandler = createRequestHandler(
	async (request) =>
		(await angularApp.handle(request)) ??
		new Response('Not found', { status: 404 })
);
