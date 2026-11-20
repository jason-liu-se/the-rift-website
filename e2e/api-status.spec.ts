// The status banner above the navbar: shown when the API is down or the
// browser is offline, accessible, and dismissible by keyboard.
import { Page } from '@playwright/test';
import { environment } from '../src/environments/environment.development';
import { NEWS_POSTS } from '../src/app/testing/api-fixtures';
import { scanForViolations } from './support/axe';
import { failApiRequests } from './support/mock-api';
import { gotoRoute } from './support/navigation';
import { TAG } from './support/projects';
import { routeFor } from './support/routes';
import { expect, test } from './support/test';

/** Opens the news page by in-app navigation while the API fails in the browser. */
async function openNewsWhileApiIsDown(
	page: Page
): Promise<() => Promise<void>> {
	await gotoRoute(page, routeFor('/'));
	const restoreApi = await failApiRequests(page, '/news');
	const menuButton = page.locator('.hamburger-menu-button');
	if (await menuButton.isVisible()) {
		await menuButton.click();
	}
	await page
		.locator('nav')
		.getByRole('link', { name: 'News', exact: true })
		.click();
	return restoreApi;
}

test('the banner says the services are down, and sits above the navbar', async ({
	page
}) => {
	await openNewsWhileApiIsDown(page);

	const banner = page.locator('app-status-banner .banner');
	await expect(banner).toContainText("The Rift's services are down");
	const bannerBox = (await banner.boundingBox())!;
	const navbarBox = (await page
		.locator('.rift-navbar-wrapper')
		.boundingBox())!;
	expect(navbarBox.y).toBeGreaterThanOrEqual(
		bannerBox.y + bannerBox.height - 1
	);
});

test('Enter on the dismiss button hides the banner and keeps focus in the page', async ({
	page
}) => {
	await openNewsWhileApiIsDown(page);
	await expect(page.locator('app-status-banner .banner')).toBeVisible();

	await page.getByRole('button', { name: 'Dismiss status message' }).focus();
	await page.keyboard.press('Enter');

	await expect(page.locator('app-status-banner .message')).toBeEmpty();
	expect(await page.evaluate(() => document.activeElement?.tagName)).toBe(
		'MAIN'
	);
});

test('going offline shows the banner, and coming back says "Back online"', async ({
	page,
	context
}) => {
	await gotoRoute(page, routeFor('/'));

	await context.setOffline(true);
	await expect(page.locator('app-status-banner .banner')).toContainText(
		"You're offline."
	);
	// Scanned here, not on a data page: its navbar link sits over a hero image.
	expect(await scanForViolations(page)).toEqual([]);

	await context.setOffline(false);
	await expect(page.locator('app-status-banner .banner')).toContainText(
		'Back online'
	);
	expect(await scanForViolations(page)).toEqual([]);
});

test('the open mobile menu fits the screen below the banner @mobile-only', async ({
	page
}) => {
	await page.setViewportSize({ width: 320, height: 640 });
	await openNewsWhileApiIsDown(page);
	await expect(page.locator('app-status-banner .banner')).toBeVisible();
	await page.locator('.hamburger-menu-button').click();

	const bottom = await page
		.locator('.rift-navbar-wrapper')
		.evaluate((element) => element.getBoundingClientRect().bottom);
	expect(bottom).toBeLessThanOrEqual(640);
});

test(`${TAG.desktopOnly} the account menu sits below the banner and is not covered by it`, async ({
	page,
	context
}) => {
	// Must match SAVED_USER_KEY (auth.service.ts, which pulls in Angular).
	const editor = JSON.stringify({ id: '1', username: 'editor' });
	await page.addInitScript(
		(user) => localStorage.setItem('session-user', user),
		editor
	);
	await page.route(`${environment.API_URL}/auth/me**`, (route) =>
		route.fulfill({ status: 200, json: JSON.parse(editor) })
	);
	await gotoRoute(page, routeFor('/news'));
	await context.setOffline(true);
	const banner = page.locator('app-status-banner .banner');
	await expect(banner).toBeVisible();

	await page.getByRole('button', { name: 'Account menu' }).click();
	const menu = page.getByRole('menu', { name: 'Account' });
	await expect(menu).toBeVisible();

	const bannerBox = (await banner.boundingBox())!;
	const bannerBottom = bannerBox.y + bannerBox.height;
	expect((await menu.boundingBox())!.y).toBeGreaterThanOrEqual(bannerBottom);
	expect(
		(await page.locator('.user-item').boundingBox())!.y
	).toBeGreaterThanOrEqual(bannerBottom - 1);
});

test('"Back online" is hidden by the first navigation after it', async ({
	page,
	context
}) => {
	await gotoRoute(page, routeFor('/'));
	await context.setOffline(true);
	await context.setOffline(false);
	await expect(page.locator('app-status-banner .message')).toHaveText(
		'Back online'
	);

	const menuButton = page.locator('.hamburger-menu-button');
	if (await menuButton.isVisible()) {
		await menuButton.click();
	}
	await page
		.locator('nav')
		.getByRole('link', { name: 'News', exact: true })
		.click();

	await expect(page.locator('app-status-banner .message')).toBeEmpty();
});

test('a page that failed because the API was down reloads when it is back', async ({
	page
}) => {
	const restoreApi = await openNewsWhileApiIsDown(page);
	await expect(
		page
			.getByRole('alert')
			.getByRole('heading', { name: "Couldn't load the news" })
	).toBeVisible();

	// The API is back; the health check (brought forward) finds out.
	await restoreApi();
	await page.evaluate(() => window.dispatchEvent(new Event('online')));

	await expect(
		page.getByText(NEWS_POSTS[0].title, { exact: true })
	).toBeVisible();
	await expect(page.locator('app-fallback-panel')).toHaveCount(0);
});
