// Answers The Rift API and BlueMap requests in the browser, so the suite
// never needs either service running, and blocks every other outside request.
// Paths mirror ../web-server/src/routes.
import { Page } from '@playwright/test';
// The suite runs against `npm start`, which serves the development environment.
import { environment } from '../../src/environments/environment.development';
import {
	CountResponse,
	GalleryImage
} from '../../src/app/interfaces/api-responses';
import {
	DOWNLOAD_COLLECTIONS,
	GALLERY_COLLECTIONS,
	NEWS_ITEMS,
	paginate
} from '../../src/app/testing/api-fixtures';

const { API_URL, BLUEMAP_URL } = environment;

// The only outside hosts allowed through. src/index.html loads fonts from
// them, and blocking the Material Icons font would render icon buttons as
// text ("menu", "close"), changing their accessible names. Serving the fonts
// locally would make the suite fully offline.
const ALLOWED_EXTERNAL_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

const BLUEMAP_PLACEHOLDER =
	'<!doctype html><html lang="en"><title>BlueMap</title></html>';

const GALLERY_COUNT_PATH = /^\/gallery\/([^/]+)\/count$/;
const GALLERY_PAGE_PATH = /^\/gallery\/([^/]+)$/;

interface IMockResponse {
	status: number;
	json: unknown;
}

const ok = (json: unknown): IMockResponse => ({ status: 200, json });
const badRequest: IMockResponse = {
	status: 400,
	json: { error: 'ERROR: invalid request parameters' }
};

/**
 * Reads an integer query parameter the way the server's `paginationQuery`
 * does: missing gives `fallback`; a non-integer or a value below `min` gives
 * undefined, which the server answers with a 400.
 */
function queryInteger(
	params: URLSearchParams,
	name: string,
	min: number,
	fallback: number
): number | undefined {
	const value = params.get(name);
	if (value === null) {
		return fallback;
	}

	const number = Number(value);
	return Number.isInteger(number) && number >= min ? number : undefined;
}

function paginateByQuery<T>(
	items: T[],
	params: URLSearchParams
): IMockResponse {
	const startIndex = queryInteger(params, 'startIndex', 0, 0);
	const limit = queryInteger(params, 'limit', 1, items.length);

	return startIndex === undefined || limit === undefined
		? badRequest
		: ok(paginate(items, startIndex, limit));
}

function galleryCollection(encodedName: string): GalleryImage[] | undefined {
	return GALLERY_COLLECTIONS[decodeURIComponent(encodedName)];
}

function respondTo(url: URL): IMockResponse {
	const notFound = { status: 404, json: { error: `ERROR: ${url.pathname}` } };

	if (url.pathname === '/news') {
		return paginateByQuery(NEWS_ITEMS, url.searchParams);
	}
	if (url.pathname === '/downloads') {
		return ok(DOWNLOAD_COLLECTIONS);
	}

	const countMatch = GALLERY_COUNT_PATH.exec(url.pathname);
	if (countMatch) {
		const images = galleryCollection(countMatch[1]);
		const count: CountResponse | undefined = images && {
			total: images.length
		};
		return count ? ok(count) : notFound;
	}

	const pageMatch = GALLERY_PAGE_PATH.exec(url.pathname);
	if (pageMatch) {
		const images = galleryCollection(pageMatch[1]);
		return images ? paginateByQuery(images, url.searchParams) : notFound;
	}

	return notFound;
}

export async function mockExternalServices(
	page: Page,
	appUrl: string
): Promise<void> {
	const handledOrigins = [appUrl, API_URL, BLUEMAP_URL].map(
		(url) => new URL(url).origin
	);

	// Registered first: Playwright tries the most recently added route first,
	// so the API and BlueMap handlers below take precedence over this one.
	await page.route(
		(url) =>
			!handledOrigins.includes(url.origin) &&
			!ALLOWED_EXTERNAL_HOSTS.includes(url.hostname),
		(route) => route.abort('blockedbyclient')
	);
	await page.route(`${API_URL}/**`, (route) =>
		route.fulfill(respondTo(new URL(route.request().url())))
	);
	await page.route(`${BLUEMAP_URL}/**`, (route) =>
		route.fulfill({ contentType: 'text/html', body: BLUEMAP_PLACEHOLDER })
	);
}
