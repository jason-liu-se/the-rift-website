// What visitors see when something fails: a data page's error state and
// retry, and the 404 page.
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
