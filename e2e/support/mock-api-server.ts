// Playwright global setup: serves the mock API (respondTo in mock-api.ts) at
// the development API_URL for the requests the dev server makes while
// rendering pages on the server, which the in-browser mocks can't intercept.
// It also stops the suite from reaching a real API running on that port.
import { once } from 'node:events';
import { createServer } from 'node:http';
import { environment } from '../../src/environments/environment.development';
import { respondTo } from './mock-api';

export default async function startMockApiServer(): Promise<
	() => Promise<void>
> {
	const apiUrl = new URL(environment.API_URL);
	const server = createServer((request, response) => {
		const { status, json } = respondTo(new URL(request.url ?? '/', apiUrl));
		response.writeHead(status, { 'Content-Type': 'application/json' });
		response.end(JSON.stringify(json));
	});

	// No host: listens on IPv4 and IPv6, whichever "localhost" resolves to.
	server.listen(Number(apiUrl.port));
	try {
		await once(server, 'listening');
	} catch (error) {
		throw new Error(
			`Can't start the mock API at ${environment.API_URL}. Stop anything using that port (such as a local API) before running the e2e tests.`,
			{ cause: error }
		);
	}

	// Returned functions run as global teardown.
	return () => new Promise((resolve) => server.close(() => resolve()));
}
