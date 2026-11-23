// Answers The Rift API and BlueMap requests in the browser, so the suite
// never needs either service running, and blocks every other outside request.
// API requests made by the dev server while rendering pages on the server are
// answered by mock-api-server.ts with the same responses.
// Paths mirror ../web-server/src/routes.
import { Page } from '@playwright/test';
// The suite runs against `npm start`, which serves the development environment.
import { environment } from '../../src/environments/environment.development';
import {
	CONTENT_VERSION,
	GalleryCollectionFixture,
	DOWNLOAD_COLLECTIONS,
	EDITOR_DOWNLOAD_COLLECTIONS,
	EDITOR_DOWNLOAD_ITEMS,
	EDITOR_GALLERY_COLLECTIONS,
	EDITOR_GALLERY_IMAGES,
	EDITOR_MAP_SEASONS,
	EDITOR_NEWS_POSTS,
	GALLERY_COLLECTIONS,
	MAP_SEASONS,
	NEWS_DETAIL_VERSION,
	NEWS_POSTS,
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

const GALLERY_PAGE_PATH = /^\/gallery\/([^/]+)$/;
/** The editor tools' lists (unfiltered) and collections. */
const EDITOR_LISTS: Record<string, unknown[]> = {
	'/editor/news': EDITOR_NEWS_POSTS,
	'/editor/gallery/images': EDITOR_GALLERY_IMAGES,
	'/editor/downloads/items': EDITOR_DOWNLOAD_ITEMS,
	'/editor/maps/seasons': EDITOR_MAP_SEASONS
};
const EDITOR_COLLECTIONS: Record<string, unknown[]> = {
	'/editor/gallery/collections': EDITOR_GALLERY_COLLECTIONS,
	'/editor/downloads/collections': EDITOR_DOWNLOAD_COLLECTIONS
};

const GALLERY_TAGS_PATH = /^\/gallery\/([^/]+)\/tags$/;

export interface IMockResponse {
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

function galleryCollection(
	encodedSlug: string
): GalleryCollectionFixture | undefined {
	const slug = decodeURIComponent(encodedSlug);
	return GALLERY_COLLECTIONS.find((collection) => collection.slug === slug);
}

/** The images with every tag in `tags` (comma-separated), as the server filters. */
function withTags(
	collection: GalleryCollectionFixture,
	params: URLSearchParams
) {
	const tags = params.get('tags')?.split(',') ?? [];
	return collection.images.filter((image) =>
		tags.every((tag) => image.tags.includes(tag))
	);
}

/** The fixture response to an API request; shared with mock-api-server.ts. */
export function respondTo(url: URL): IMockResponse {
	const notFound = { status: 404, json: { error: `ERROR: ${url.pathname}` } };

	if (url.pathname === '/content/version') {
		return ok(CONTENT_VERSION);
	}
	if (url.pathname === '/content/version/news') {
		return ok(NEWS_DETAIL_VERSION);
	}
	if (url.pathname === '/news') {
		return paginateByQuery(NEWS_POSTS, url.searchParams);
	}
	if (url.pathname === '/downloads') {
		return ok(DOWNLOAD_COLLECTIONS);
	}
	if (url.pathname === '/gallery') {
		return ok(
			GALLERY_COLLECTIONS.map(({ slug, title }) => ({ slug, title }))
		);
	}
	if (url.pathname === '/maps/seasons') {
		return ok(MAP_SEASONS);
	}
	if (url.pathname in EDITOR_LISTS) {
		return paginateByQuery(EDITOR_LISTS[url.pathname], url.searchParams);
	}
	if (url.pathname in EDITOR_COLLECTIONS) {
		return ok(EDITOR_COLLECTIONS[url.pathname]);
	}
	if (url.pathname === '/editor/drafts') {
		return ok([]);
	}

	const pageMatch = GALLERY_PAGE_PATH.exec(url.pathname);
	if (pageMatch) {
		const collection = galleryCollection(pageMatch[1]);
		return collection
			? paginateByQuery(
					withTags(collection, url.searchParams),
					url.searchParams
				)
			: notFound;
	}
	const tagsMatch = GALLERY_TAGS_PATH.exec(url.pathname);
	if (tagsMatch) {
		const collection = galleryCollection(tagsMatch[1]);
		const tags = collection?.images.flatMap((image) => image.tags);
		return tags ? ok([...new Set(tags)].sort()) : notFound;
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

/**
 * Makes the in-browser API fail (500) for requests to `path` until the
 * returned function is called. Server-side requests still succeed, so open
 * the page by in-app navigation to see the browser's failure state.
 */
export async function failApiRequests(
	page: Page,
	path: string
): Promise<() => Promise<void>> {
	const url = `${API_URL}${path}**`;
	await page.route(url, (route) =>
		route.fulfill({ status: 500, json: { error: 'ERROR: mock failure' } })
	);
	return () => page.unroute(url);
}
