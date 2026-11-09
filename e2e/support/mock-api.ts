// Answers The Rift API and BlueMap requests in the browser, so the suite
// never needs either service running, and blocks every other outside request.
// Paths mirror ../web-server/src/routes.
import { Page } from '@playwright/test';
// The suite runs against `npm start`, which serves the development environment.
import { environment } from '../../src/environments/environment.development';
import {
	ICountResponse,
	IPaginatedResponse
} from '../../src/app/interfaces/paginated-response.interface';
import { ICaptionCard } from '../../src/app/interfaces/slideshow-image.interface';
import {
	DOWNLOAD_COLLECTIONS,
	GALLERY_COLLECTIONS,
	NEWS_ITEMS
} from './api-fixtures';

const { apiEndpoint: API_ENDPOINT, bluemapUrl: BLUEMAP_URL } = environment;

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

function paginate<T>(
	items: T[],
	params: URLSearchParams
): IPaginatedResponse<T> {
	const startIndex = Number(params.get('startIndex') ?? 0);
	const limit = Number(params.get('limit') ?? items.length);

	return {
		items: items.slice(startIndex, startIndex + limit),
		total: items.length
	};
}

function galleryCollection(encodedName: string): ICaptionCard[] | undefined {
	return GALLERY_COLLECTIONS[decodeURIComponent(encodedName)];
}

function respondTo(url: URL): IMockResponse {
	const notFound = { status: 404, json: { error: `ERROR: ${url.pathname}` } };

	if (url.pathname === '/news') {
		return ok(paginate(NEWS_ITEMS, url.searchParams));
	}
	if (url.pathname === '/downloads') {
		return ok(DOWNLOAD_COLLECTIONS);
	}

	const countMatch = GALLERY_COUNT_PATH.exec(url.pathname);
	if (countMatch) {
		const images = galleryCollection(countMatch[1]);
		const count: ICountResponse | undefined = images && {
			total: images.length
		};
		return count ? ok(count) : notFound;
	}

	const pageMatch = GALLERY_PAGE_PATH.exec(url.pathname);
	if (pageMatch) {
		const images = galleryCollection(pageMatch[1]);
		return images ? ok(paginate(images, url.searchParams)) : notFound;
	}

	return notFound;
}

export async function mockExternalServices(
	page: Page,
	appUrl: string
): Promise<void> {
	const handledOrigins = [appUrl, API_ENDPOINT, BLUEMAP_URL].map(
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
	await page.route(`${API_ENDPOINT}/**`, (route) =>
		route.fulfill(respondTo(new URL(route.request().url())))
	);
	await page.route(`${BLUEMAP_URL}/**`, (route) =>
		route.fulfill({ contentType: 'text/html', body: BLUEMAP_PLACEHOLDER })
	);
}
