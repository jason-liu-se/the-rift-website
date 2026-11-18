// What visitors see when something fails: a data page's error state and
// retry, the 404 page, and the offline banner.
import { Page } from '@playwright/test';
import { NEWS_POSTS } from '../src/app/testing/api-fixtures';
import { failApiRequests } from './support/mock-api';
import { gotoRoute } from './support/navigation';
import { routeFor } from './support/routes';
import { expect, test } from './support/test';

/** Follows a navbar link, opening the hamburger menu first on mobile. */
async function clickNavLink(page: Page, name: string): Promise<void> {
	const menuButton = page.locator('.hamburger-menu-button');
	if (await menuButton.isVisible()) {
		await menuButton.click();
	}
	await page.locator('nav').getByRole('link', { name, exact: true }).click();
}

const focusedTag = (page: Page) =>
	page.evaluate(() => document.activeElement?.tagName);

test('a data page that fails to load shows an error state, and Try again loads it', async ({
	page
}) => {
	// The server render succeeds, so the failure has to come from the
	// browser: open the news page by in-app navigation.
	await gotoRoute(page, routeFor('/'));
	const restoreApi = await failApiRequests(page, '/news');
	await clickNavLink(page, 'News');

	const errorState = page.locator('app-error-state');
	await expect(
		page
			.getByRole('alert')
			.getByRole('heading', { name: "Couldn't load the news" })
	).toBeVisible();

	await restoreApi();
	await errorState.getByRole('button', { name: 'Try again' }).focus();
	await page.keyboard.press('Enter');

	await expect(
		page.getByText(NEWS_POSTS[0].title, { exact: true })
	).toBeVisible();
	await expect(errorState).toHaveCount(0);
	// The button went away with the error state; focus mustn't fall to <body>.
	await expect.poll(() => focusedTag(page)).not.toBe('BODY');
});

test('the 404 page says so and links home', async ({ page }) => {
	await gotoRoute(page, routeFor('/not-a-page'));

	await expect(
		page.getByRole('heading', { level: 1, name: 'Page not found' })
	).toBeVisible();
	await page.getByRole('link', { name: 'Back to Home' }).click();

	await expect(page).toHaveURL('/');
});

test('going offline shows a banner above the navbar, without covering the page', async ({
	page
}) => {
	await gotoRoute(page, routeFor('/news'));
	const navbar = page.locator('.rift-navbar-wrapper');
	const navbarTopOnline = (await navbar.boundingBox())!.y;

	await page.context().setOffline(true);

	const banner = page.locator('app-banner .banner');
	await expect(banner).toHaveText(/Can't connect/);
	const bannerBox = (await banner.boundingBox())!;
	const bannerBottom = bannerBox.y + bannerBox.height;
	await expect
		.poll(async () => (await navbar.boundingBox())!.y)
		.toBe(navbarTopOnline + bannerBox.height);
	const contentTop = (await page.locator('main').boundingBox())!.y;
	expect(contentTop).toBeGreaterThanOrEqual(bannerBottom);

	await page.context().setOffline(false);
	await expect(banner).toHaveText(/Back online/);

	await banner.getByRole('button', { name: 'Dismiss: Back online.' }).focus();
	await page.keyboard.press('Enter');
	await expect(banner).toHaveCount(0);
	await expect.poll(() => focusedTag(page)).not.toBe('BODY');
	await expect
		.poll(async () => (await navbar.boundingBox())!.y)
		.toBe(navbarTopOnline);
});

test('losing the connection while the browser still thinks it is online warns on the next navigation, without reloading', async ({
	page
}) => {
	await gotoRoute(page, routeFor('/'));
	// Everything fails to get through (like airplane mode on a machine whose
	// VM adapter stays connected), but navigator.onLine stays true.
	const disconnect = (route: { abort: (code: string) => Promise<void> }) =>
		route.abort('internetdisconnected');
	await page.route('**/*', disconnect);
	let reloaded = false;
	page.on('load', () => (reloaded = true));

	await clickNavLink(page, 'News');

	const banner = page.locator('app-banner .banner');
	await expect(banner).toHaveText(/Can't connect/);
	expect(await page.evaluate(() => navigator.onLine)).toBe(true);
	expect(reloaded).toBe(false);

	await page.unroute('**/*', disconnect);
	await clickNavLink(page, 'Gallery');

	await expect(banner).toHaveText(/Back online/);
});
