import { routes } from 'src/app/app.routes';
import * as sitePaths from './site-paths';

describe('site paths', () => {
	const routePaths = routes.map(({ path }) => `/${path ?? ''}`);
	const paths = Object.entries(sitePaths).flatMap(([name, path]) =>
		typeof path === 'string' ? [[name, path]] : []
	);

	it.each(paths)('%s is a route', (_, path) => {
		expect(routePaths).toContain(path);
	});
});
