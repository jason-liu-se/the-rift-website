import { routes } from './app.routes';
import { serverRoutes } from './app.routes.server';

/** Whether a server route path covers an app route path (`*` = one segment). */
function covers(serverPath: string, appPath: string): boolean {
	const serverSegments = serverPath.split('/');
	const appSegments = appPath.split('/');
	return (
		serverSegments.length === appSegments.length &&
		serverSegments.every(
			(segment, i) => segment === '*' || segment === appSegments[i]
		)
	);
}

describe('serverRoutes', () => {
	const appPaths = routes
		.map((route) => route.path ?? '')
		.filter((path) => path !== '**');

	// Otherwise the route falls through to the 404 entry.
	it.each(appPaths)('gives the "%s" route a render mode', (appPath) => {
		expect(
			serverRoutes.some(
				(route) => route.path !== '**' && covers(route.path, appPath)
			)
		).toBe(true);
	});

	it('serves unknown URLs with a 404 status', () => {
		expect(serverRoutes.at(-1)).toEqual(
			expect.objectContaining({ path: '**', status: 404 })
		);
	});
});
