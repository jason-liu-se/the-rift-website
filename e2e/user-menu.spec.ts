import { Page } from '@playwright/test';
import { signIn } from './support/auth';
import { environment } from '../src/environments/environment.development';
import { scanForViolations } from './support/axe';
import { gotoRoute } from './support/navigation';
import { TAG } from './support/projects';
import { routeFor } from './support/routes';
import { expect, test } from './support/test';

const { API_URL } = environment;

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

	test(`${TAG.desktopOnly} opens by keyboard, and Escape restores focus`, async ({
		page
	}) => {
		await trigger(page).focus();
		await page.keyboard.press('Enter');

		await expect(menu(page)).toBeVisible();
		await expect(
			page.getByRole('menuitem', { name: 'Admin' })
		).toBeFocused();
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

		await expect(
			page.locator('.message').getByText("You've logged out")
		).toBeVisible();
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

test.describe('user menu position on desktop', () => {
	// The narrowest desktop width, and a wide one.
	for (const width of [960, 1920]) {
		test(`${TAG.desktopOnly} is pinned to the right edge at ${width}px and the menu opens below it`, async ({
			page
		}) => {
			await page.setViewportSize({ width, height: 800 });
			await signIn(page);
			await gotoRoute(page, routeFor('/'));
			const avatar = trigger(page).locator('.avatar');
			const box = await avatar.boundingBox();

			// 1rem from the edge, clear of the Join button.
			expect(box!.x + box!.width).toBeCloseTo(width - 16, 0);
			const join = await page
				.getByRole('navigation', { name: 'Main' })
				.getByRole('button', { name: 'Join' })
				.boundingBox();
			expect(join!.x + join!.width).toBeLessThan(box!.x);

			await trigger(page).click();
			await expect(menu(page)).toBeVisible();
			const panel = await page.locator('.panel').boundingBox();
			expect(panel!.y).toBeGreaterThan(box!.y + box!.height);
			expect(panel!.x).toBeGreaterThanOrEqual(0);
			expect(panel!.x + panel!.width).toBeLessThanOrEqual(width);
		});
	}
});

test.describe('focus after logging out of a public page', () => {
	test(`${TAG.desktopOnly} lands on <main>, not <body>`, async ({ page }) => {
		await signIn(page);
		await gotoRoute(page, routeFor('/'));
		await trigger(page).click();
		await page.getByRole('menuitem', { name: 'Log out' }).click();

		await expect(
			page.locator('.message').getByText("You've logged out")
		).toBeVisible();
		await expect(page.locator('main')).toBeFocused();
	});

	test(`${TAG.mobileOnly} lands on <main> after Log out in the hamburger menu`, async ({
		page
	}) => {
		await signIn(page);
		await gotoRoute(page, routeFor('/'));
		await page.getByRole('button', { name: 'Menu' }).click();
		await page.getByRole('button', { name: 'Log out' }).click();

		await expect(
			page.locator('.message').getByText("You've logged out")
		).toBeVisible();
		await expect(page.locator('main')).toBeFocused();
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

		await expect(
			page.locator('.message').getByText("You've logged out")
		).toBeVisible();
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
