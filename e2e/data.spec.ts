// Smoke tests that API responses reach the screen in the real app, and that a
// page load fetches the content version once. Detailed request/response
// behaviour is covered by the unit tests.
import {
	CONTENT_VERSION,
	DOWNLOAD_COLLECTIONS,
	GALLERY_COLLECTIONS,
	MAP_SEASONS,
	NEWS_POSTS
} from '../src/app/testing/api-fixtures';
import { environment } from '../src/environments/environment.development';
import { Page } from '@playwright/test';
import { expect, test } from './support/test';

const NEWS_PAGE_SIZE = 10;

test('the news page shows the first page of items and the page count', async ({
	page
}) => {
	await page.goto('/news');

	await expect(page.locator('.news-post-content')).toHaveCount(
		NEWS_PAGE_SIZE
	);
	await expect(
		page.getByText(NEWS_POSTS[0].title, { exact: true })
	).toBeVisible();
	await expect(page.getByText('Page 1 of 2').first()).toBeVisible();
});

test('the gallery shows how many photos each collection has', async ({
	page
}) => {
	await page.goto('/gallery');

	for (const images of Object.values(GALLERY_COLLECTIONS)) {
		await expect(page.getByText(`${images.length} photos`)).toBeVisible();
	}
});

test("a gallery showcase shows its collection's total", async ({ page }) => {
	await page.goto('/gallery/season5');

	await expect(
		page.getByText(`Results: ${GALLERY_COLLECTIONS['season5'].length}`)
	).toBeVisible();
});

test('the downloads page lists each collection', async ({ page }) => {
	await page.goto('/downloads');

	for (const collection of DOWNLOAD_COLLECTIONS) {
		await expect(page.getByText(collection.items[0].title)).toBeVisible();
	}
});

test("the map page links each season's dimensions", async ({ page }) => {
	await page.goto('/map');

	for (const { dimensions } of MAP_SEASONS) {
		for (const { name } of dimensions) {
			await expect(
				page.getByRole('link', { name, exact: true })
			).toBeVisible();
		}
	}
});

/** Records the URLs of the API requests the browser makes. */
function recordApiRequests(page: Page): string[] {
	const urls: string[] = [];
	page.on('request', (request) => {
		if (request.url().startsWith(environment.API_URL)) {
			urls.push(request.url());
		}
	});
	return urls;
}

async function openDownloadsInApp(page: Page): Promise<void> {
	await page.getByRole('link', { name: 'Downloads' }).first().click();
	await expect(
		page.getByText(DOWNLOAD_COLLECTIONS[0].items[0].title)
	).toBeVisible();
}

const versionedDownloadsUrl = `${environment.API_URL}/downloads?v=${CONTENT_VERSION.version}`;

test("a page load keeps the server's content version for later reads", async ({
	page
}) => {
	const browserApiRequests = recordApiRequests(page);

	// Hydration reuses the server's responses, including the version.
	await page.goto('/news', { waitUntil: 'networkidle' });
	expect(browserApiRequests).toEqual([]);

	await openDownloadsInApp(page);
	expect(browserApiRequests).toEqual([versionedDownloadsUrl]);
});

test('a page load without API data fetches the version on the first read', async ({
	page
}) => {
	const browserApiRequests = recordApiRequests(page);

	await page.goto('/about', { waitUntil: 'networkidle' });
	await openDownloadsInApp(page);

	expect(browserApiRequests).toEqual([
		`${environment.API_URL}/content/version`,
		versionedDownloadsUrl
	]);
});
