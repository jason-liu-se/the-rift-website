// Smoke tests that API responses reach the screen in the real app. Detailed
// request/response behaviour is covered by the unit tests.
import {
	DOWNLOAD_COLLECTIONS,
	GALLERY_COLLECTIONS,
	NEWS_ITEMS
} from '../src/app/testing/api-fixtures';
import { expect, test } from './support/test';

const NEWS_PAGE_SIZE = 10;

test('the news page shows the first page of items and the page count', async ({
	page
}) => {
	await page.goto('/news');

	await expect(page.locator('.news-item-content')).toHaveCount(
		NEWS_PAGE_SIZE
	);
	await expect(
		page.getByText(NEWS_ITEMS[0].title, { exact: true })
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
	await page.goto('/gallery/season-5');

	await expect(
		page.getByText(`Results: ${GALLERY_COLLECTIONS['season-5'].length}`)
	).toBeVisible();
});

test('the downloads page lists each collection', async ({ page }) => {
	await page.goto('/downloads');

	for (const collection of DOWNLOAD_COLLECTIONS) {
		await expect(page.getByText(collection.items[0].title)).toBeVisible();
	}
});
