// Server entry: serves prerendered pages and renders server routes on request
// (render modes in src/app/app.routes.server.ts). Uses web-standard
// Request/Response: it's the Cloudflare Worker (default export, see
// wrangler.jsonc), and the Angular dev server calls `reqHandler`.
import { AngularAppEngine, createRequestHandler } from '@angular/ssr';
import { environment } from './environments/environment';

const angularApp = new AngularAppEngine({
	// Requests for other hostnames are rejected, to prevent server-side request
	// forgery through the Host header. *.workers.dev covers preview URLs; the dev
	// server skips this check.
	allowedHosts: [new URL(environment.SITE_URL).hostname, '*.workers.dev'],
	// Cloudflare sets these itself. Angular falls back to rendering in the
	// browser when it sees proxy headers it hasn't been told to trust.
	trustProxyHeaders: ['x-forwarded-for', 'x-forwarded-proto']
});

// public/_headers sets these for static files; this covers rendered pages.
const SECURITY_HEADERS = {
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'X-Frame-Options': 'DENY'
};

export const reqHandler = createRequestHandler(async (request) => {
	const rendered =
		(await angularApp.handle(request)) ??
		new Response('Not found', { status: 404 });
	// A copy, since responses from fetch() on Workers have read-only headers.
	const response = new Response(rendered.body, rendered);
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		response.headers.set(name, value);
	}
	return response;
});

const API_HEALTH_URL = `${environment.API_URL}/health`;
/** Enough to identify an error or challenge page in the Workers logs. */
const MAX_LOGGED_BODY_LENGTH = 2000;

export default {
	fetch: reqHandler,
	// Runs on the Cron Trigger in wrangler.jsonc: keeps the API's free-tier host
	// from putting it to sleep, which would slow the next page render.
	async scheduled(controller: { cron: string; scheduledTime: number }) {
		const started = Date.now();
		const context = {
			url: API_HEALTH_URL,
			cron: controller.cron,
			scheduledTime: new Date(controller.scheduledTime).toISOString()
		};
		let response: Response;
		try {
			response = await fetch(API_HEALTH_URL);
		} catch (error) {
			console.error('API health check threw', {
				...context,
				durationMs: Date.now() - started,
				error: error instanceof Error ? error.stack : String(error)
			});
			return;
		}
		if (response.ok) {
			return;
		}
		// Everything the response says about who refused it and why (a 403 is
		// often a WAF or bot challenge page, identifiable from its headers/body).
		const body = await response
			.text()
			.catch((error) => `<unreadable: ${error}>`);
		console.error(`API health check failed: HTTP ${response.status}`, {
			...context,
			durationMs: Date.now() - started,
			status: response.status,
			statusText: response.statusText,
			redirected: response.redirected,
			finalUrl: response.url,
			headers: Object.fromEntries(response.headers),
			body: body.slice(0, MAX_LOGGED_BODY_LENGTH)
		});
	}
};
