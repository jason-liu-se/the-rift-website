// The status banner above the navbar: shown when the API is down or the
// browser is offline, accessible, and dismissible by keyboard.
import { Page } from '@playwright/test';
import { scanForViolations } from './support/axe';
import { failApiRequests } from './support/mock-api';
import { gotoRoute } from './support/navigation';
import { routeFor } from './support/routes';
import { expect, test } from './support/test';

/** Opens the news page by in-app navigation while the API fails in the browser. */
async function openNewsWhileApiIsDown(page: Page): Promise<void> {
	await gotoRoute(page, routeFor('/'));
	await failApiRequests(page, '/news');
	const menuButton = page.locator('.hamburger-menu-button');
	if (await menuButton.isVisible()) {
		await menuButton.click();
	}
	await page
		.locator('nav')
		.getByRole('link', { name: 'News', exact: true })
		.click();
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
