// Answers The Rift API and BlueMap requests in the browser, so the suite
// never needs either service running. Paths mirror ../web-server/src/routes.
import { Page } from '@playwright/test';
import { Constants } from '../../src/app/config/constants';
import {
	DOWNLOAD_COLLECTIONS,
	GALLERY_COLLECTIONS,
	NEWS_ITEMS
} from './api-fixtures';

const { API_ENDPOINT, BLUEMAP_URL } = new Constants();

const BLUEMAP_PLACEHOLDER =
	'<!doctype html><html lang="en"><title>BlueMap</title></html>';

const GALLERY_COUNT_PATH = /^\/gallery\/([^/]+)\/count$/;
const GALLERY_PAGE_PATH = /^\/gallery\/([^/]+)$/;

interface IMockResponse {
	status: number;
	json: unknown;
}

function paginate<T>(items: T[], params: URLSearchParams): IMockResponse {
	const startIndex = Number(params.get('startIndex') ?? 0);
	const limit = Number(params.get('limit') ?? items.length);

	return {
		status: 200,
		json: {
			items: items.slice(startIndex, startIndex + limit),
			total: items.length
		}
	};
}

function galleryCollection(encodedName: string): unknown[] | undefined {
	return GALLERY_COLLECTIONS[decodeURIComponent(encodedName)];
}

function respondTo(url: URL): IMockResponse {
	const notFound = { status: 404, json: { error: `ERROR: ${url.pathname}` } };

	if (url.pathname === '/news') {
		return paginate(NEWS_ITEMS, url.searchParams);
	}
	if (url.pathname === '/downloads') {
		return { status: 200, json: DOWNLOAD_COLLECTIONS };
	}

	const countMatch = GALLERY_COUNT_PATH.exec(url.pathname);
	if (countMatch) {
		const images = galleryCollection(countMatch[1]);
		return images
			? { status: 200, json: { total: images.length } }
			: notFound;
	}

	const pageMatch = GALLERY_PAGE_PATH.exec(url.pathname);
	if (pageMatch) {
		const images = galleryCollection(pageMatch[1]);
		return images ? paginate(images, url.searchParams) : notFound;
	}

	return notFound;
}

export async function mockExternalServices(page: Page): Promise<void> {
	await page.route(`${API_ENDPOINT}/**`, (route) =>
		route.fulfill(respondTo(new URL(route.request().url())))
	);
	await page.route(`${BLUEMAP_URL}/**`, (route) =>
		route.fulfill({ contentType: 'text/html', body: BLUEMAP_PLACEHOLDER })
	);
}
