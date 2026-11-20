import { Page } from '@playwright/test';
import { environment } from '../src/environments/environment.development';
import { scanForViolations } from './support/axe';
import { gotoRoute } from './support/navigation';
import { TAG } from './support/projects';
import { routeFor } from './support/routes';
import { expect, test } from './support/test';

// Must match SAVED_USER_KEY (auth.service.ts, which pulls in Angular).
const SAVED_USER_KEY = 'session-user';
const EDITOR = { id: '1', username: 'editor' };
const { API_URL } = environment;

/** Logs in with the mock API: the saved user makes the navbar check the session. */
async function signIn(page: Page, logoutStatus = 204): Promise<void> {
	await page.addInitScript(
		([key, user]) => localStorage.setItem(key, user),
		[SAVED_USER_KEY, JSON.stringify(EDITOR)]
	);
	await page.route(`${API_URL}/auth/me**`, (route) =>
		route.fulfill({ status: 200, json: EDITOR })
	);
	await page.route(`${API_URL}/auth/logout`, (route) =>
		route.fulfill({ status: logoutStatus, body: '' })
	);
}

const trigger = (page: Page) =>
	page.getByRole('button', { name: 'Account menu' });
const menu = (page: Page) => page.getByRole('menu', { name: 'Account' });

test.describe('anonymous visitor', () => {
	test('makes no session request and sees no user menu', async ({ page }) => {
		const requests: string[] = [];
		page.on('request', (request) => requests.push(request.url()));

		await gotoRoute(page, routeFor('/news'));

		expect(requests.filter((url) => url.includes('/auth/'))).toEqual([]);
		await expect(trigger(page)).toHaveCount(0);
	});
});

test.describe('user menu on desktop', () => {
	test.beforeEach(async ({ page }) => {
		await signIn(page);
		await gotoRoute(page, routeFor('/news'));
	});

	test(`${TAG.desktopOnly} opens by keyboard, shows one avatar, and Escape restores focus`, async ({
		page
	}) => {
		await trigger(page).focus();
		await page.keyboard.press('Enter');

		await expect(menu(page)).toBeVisible();
		await expect(
			page.getByRole('menuitem', { name: 'Admin' })
		).toBeFocused();
		// The trigger's avatar is hidden: only the menu's shows.
		await expect(page.locator('nav .avatar:visible')).toHaveCount(1);
		await page.keyboard.press('ArrowDown');
		await expect(
			page.getByRole('menuitem', { name: 'Log out' })
		).toBeFocused();

		await page.keyboard.press('Escape');
		await expect(menu(page)).toBeHidden();
		await expect(trigger(page)).toBeFocused();
	});

	test(`${TAG.desktopOnly} has no accessibility violations with the menu open`, async ({
		page
	}) => {
		await trigger(page).click();
		await expect(menu(page)).toBeVisible();

		// The active link's contrast is a known issue (known-a11y-issues.ts).
		const violations = await scanForViolations(page);
		expect(
			violations.filter(({ target }) => target !== '.link-active > p')
		).toEqual([]);
	});

	test(`${TAG.desktopOnly} logging out on a public page stays and shows a toast`, async ({
		page
	}) => {
		await trigger(page).click();
		await page.getByRole('menuitem', { name: 'Log out' }).click();

		await expect(page.getByText("You've logged out")).toBeVisible();
		await expect(page).toHaveURL(/\/news$/);
		await expect(trigger(page)).toHaveCount(0);
	});
});

test.describe('user menu on mobile', () => {
	test(`${TAG.mobileOnly} lists the user, Admin and Log out in the menu`, async ({
		page
	}) => {
		await signIn(page);
		await gotoRoute(page, routeFor('/news'));
		await page.getByRole('button', { name: 'Menu' }).click();

		const nav = page.getByRole('navigation', { name: 'Main' });
		await expect(
			nav.locator('app-user-menu .mobile').getByText('editor')
		).toBeVisible();
		await expect(nav.getByRole('link', { name: 'Admin' })).toBeVisible();
		await expect(
			nav.getByRole('button', { name: 'Log out' })
		).toBeVisible();
		await expect(trigger(page)).toBeHidden();
	});
});

test.describe('logout while the API is down', () => {
	test(`${TAG.desktopOnly} still logs out, and retries on the next page load`, async ({
		page
	}) => {
		await signIn(page, 500);
		await gotoRoute(page, routeFor('/news'));
		await trigger(page).click();
		await page.getByRole('menuitem', { name: 'Log out' }).click();

		await expect(page.getByText("You've logged out")).toBeVisible();
		await expect(trigger(page)).toHaveCount(0);
		await expect
			.poll(() =>
				page.evaluate(() => localStorage.getItem('logout-pending'))
			)
			.not.toBeNull();

		const retry = page.waitForRequest(`${API_URL}/auth/logout`);
		await page.reload();
		await retry;
	});
});
