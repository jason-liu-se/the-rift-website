import { RenderMode } from '@angular/ssr';
import { routes } from './app.routes';
import { serverRoutes } from './app.routes.server';

describe('serverRoutes', () => {
	it.each(routes.map((route) => [route.path ?? '', route]))(
		'gives the "%s" route a render mode',
		(_, route) => {
			expect(['prerender', 'server', 'client']).toContain(
				route.data?.['renderMode']
			);
		}
	);

	it('turns path parameters into wildcards', () => {
		expect(serverRoutes).toContainEqual(
			expect.objectContaining({
				path: 'gallery/*',
				renderMode: RenderMode.Server
			})
		);
	});

	// Browser-only pages get their robots meta tag from JavaScript, too late for
	// crawlers that don't run it.
	it.each(['admin', 'admin/**'])(
		'renders "%s" in the browser, telling crawlers not to index it',
		(path) => {
			expect(serverRoutes.find((route) => route.path === path)).toEqual(
				expect.objectContaining({
					renderMode: RenderMode.Client,
					headers: expect.objectContaining({
						'X-Robots-Tag': 'noindex'
					})
				})
			);
		}
	);

	it('serves unknown URLs with a 404 status', () => {
		expect(serverRoutes.at(-1)).toEqual(
			expect.objectContaining({ path: '**', status: 404 })
		);
	});
});
