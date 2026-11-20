import { BrowserContext, Page } from '@playwright/test';
import { environment } from '../src/environments/environment.development';
import {
	EDITOR,
	LOGOUT_PENDING_KEY,
	SAVED_USER_KEY,
	signIn
} from './support/auth';
import { scanForViolations } from './support/axe';
import { gotoRoute } from './support/navigation';
import { TAG } from './support/projects';
import { routeFor } from './support/routes';
import { expect, test } from './support/test';

const { API_URL } = environment;

/** Logs out in another tab of the same browser, as its `logout()` does. */
async function logOutInAnotherTab(context: BrowserContext): Promise<void> {
	const otherTab = await context.newPage();
	// Any page on this site will do; a static file doesn't start the app.
	await otherTab.goto('/robots.txt');
	await otherTab.evaluate(
		([savedUserKey, pendingKey]) => {
			localStorage.setItem(pendingKey, 'true');
			localStorage.removeItem(savedUserKey);
		},
		[SAVED_USER_KEY, LOGOUT_PENDING_KEY]
	);
	await otherTab.close();
}

const dialog = (page: Page) => page.getByRole('alertdialog');
const toast = (page: Page) => page.locator('app-toast');

test.describe('on a protected page', () => {
	test.beforeEach(async ({ page }) => {
		await signIn(page);
		await page.goto('/admin#news');
		await expect(page).toHaveTitle(/Admin/);
	});

	test("another tab's logout shows the dialog, which can't be dismissed or scrolled behind", async ({
		page,
		context
	}) => {
		// Tall enough to scroll, so the scroll block has something to stop.
		await page.evaluate(() => (document.body.style.minHeight = '300vh'));

		await logOutInAnotherTab(context);

		await expect(dialog(page)).toBeVisible();
		await expect(
			dialog(page).getByRole('heading', { name: "You've logged out" })
		).toBeVisible();
		await expect(
			page.getByRole('button', { name: 'Log in again' })
		).toBeFocused();

		await page.keyboard.press('Escape');
		await expect(dialog(page)).toBeVisible();

		const scrollY = await page.evaluate(() => window.scrollY);
		await page.mouse.wheel(0, 500);
		await page.keyboard.press('End');
		expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);

		expect(await scanForViolations(page)).toEqual([]);
	});

	test('Log in again returns to the same tool after logging in', async ({
		page,
		context
	}) => {
		await logOutInAnotherTab(context);
		await page.getByRole('button', { name: 'Log in again' }).click();
		await expect(page).toHaveURL(/\/admin\/login$/);

		// The API's login callback lands on /admin, now logged in again.
		await page.goto('/admin');

		await expect(page).toHaveURL(/\/admin#news$/);
	});

	test('Go to the home page leaves the admin page', async ({
		page,
		context
	}) => {
		await logOutInAnotherTab(context);
		await page.getByRole('button', { name: 'Go to the home page' }).click();

		await expect(page).toHaveURL(/\/$/);
		await expect(dialog(page)).toHaveCount(0);
	});
});

test(`${TAG.desktopOnly} a logout in another admin tab shows its dialog, which Back off the admin page closes`, async ({
	page,
	context
}) => {
	await signIn(page);
	await gotoRoute(page, routeFor('/news'));
	await page.getByRole('button', { name: 'Account menu' }).click();
	await page.getByRole('menuitem', { name: 'Admin' }).click();
	await expect(page).toHaveURL(/\/admin$/);

	const otherTab = await context.newPage();
	await signIn(otherTab);
	await otherTab.goto('/admin');
	await otherTab.getByRole('button', { name: 'Account menu' }).click();
	await otherTab.getByRole('menuitem', { name: 'Log out' }).click();
	await expect(otherTab).toHaveURL(/\/admin\/login$/);

	await expect(
		dialog(page).getByRole('heading', { name: "You've logged out" })
	).toBeVisible();

	await page.goBack();

	await expect(page).toHaveURL(/\/news$/);
	await expect(dialog(page)).toHaveCount(0);
});

test("another tab's logout on a public page shows a toast", async ({
	page,
	context
}) => {
	await signIn(page);
	await gotoRoute(page, routeFor('/news'));

	await logOutInAnotherTab(context);

	await expect(toast(page)).toContainText('Your session has ended');
	await expect(dialog(page)).toHaveCount(0);
});

test('an expired session on loading /admin shows the toast on the login page', async ({
	page
}) => {
	await page.addInitScript(
		([key, user]) => localStorage.setItem(key, user),
		[SAVED_USER_KEY, JSON.stringify(EDITOR)]
	);
	for (const path of ['/auth/me**', '/auth/refresh']) {
		await page.route(`${API_URL}${path}`, (route) =>
			route.fulfill({ status: 401, json: { error: 'Unauthorized' } })
		);
	}

	await page.goto('/admin');

	await expect(page).toHaveURL(/\/admin\/login$/);
	await expect(toast(page)).toContainText('Your session has ended');
	await expect(dialog(page)).toHaveCount(0);
});
