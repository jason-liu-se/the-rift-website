import { NEWS_ITEMS } from './support/api-fixtures';
import {
	focused,
	focusedTabStop,
	markTabStops,
	screenshotAround
} from './support/keyboard';
import { ROUTES } from './support/routes';
import { expect, test } from './support/test';

// Desktop navbar in reading order: logo, page links, then the Join button.
const NAVBAR_TAB_ORDER = [
	'The Rift logo',
	'Home',
	'News',
	'Gallery',
	'Map',
	'Downloads',
	'About',
	'Contact',
	'Join'
];

test.describe('desktop keyboard navigation', () => {
	test.beforeEach(({ isMobile }) => {
		test.skip(isMobile, 'the mobile navbar is covered separately');
	});

	test('Tab moves through the navbar in reading order with a visible focus indicator', async ({
		page
	}) => {
		// The news page's navbar is opaque, so only focus can change its pixels.
		await page.goto('/news');
		await page.waitForLoadState('networkidle');

		const nav = page.locator('nav');
		// Baselines are taken before any Tab press so a neighbour's focus
		// ring can't be mistaken for this element's.
		const unfocused = new Map<string, Buffer>();
		for (const name of NAVBAR_TAB_ORDER) {
			const item = nav
				.getByRole('link', { name, exact: true })
				.or(nav.getByRole('button', { name, exact: true }));
			unfocused.set(name, await screenshotAround(page, item));
		}

		for (const name of NAVBAR_TAB_ORDER) {
			await page.keyboard.press('Tab');

			const element = focused(page);
			await expect(element).toHaveAccessibleName(name);
			expect(
				(await screenshotAround(page, element)).equals(
					unfocused.get(name)!
				),
				`"${name}" looks the same focused and unfocused`
			).toBe(false);
		}
	});

	test('Enter on a nav link opens that page', async ({ page }) => {
		await page.goto('/');
		await page.locator('nav').getByRole('link', { name: 'News' }).focus();

		await page.keyboard.press('Enter');

		await expect(page).toHaveURL('/news');
		await expect(page).toHaveTitle('The Rift - News');
	});

	test('the news paginator works by keyboard', async ({ page }) => {
		await page.goto('/news');
		await page.getByRole('button', { name: 'Next page' }).first().focus();

		await page.keyboard.press('Enter');

		await expect(
			page.getByText(NEWS_ITEMS[10].title, { exact: true })
		).toBeVisible();
		await expect(page.getByText('Page 2 of 2').first()).toBeVisible();
	});

	for (const route of ROUTES) {
		test(`${route.path}: Tab reaches every focusable element without getting trapped`, async ({
			page
		}) => {
			await page.goto(route.path);
			await page.waitForLoadState('networkidle');
			const stopCount = await markTabStops(page);

			const visited = new Set<string>();
			for (let press = 0; press < stopCount; press++) {
				await page.keyboard.press('Tab');
				const stop = await focusedTabStop(page);
				if (stop !== null) {
					visited.add(stop);
				}
			}

			expect(visited.size).toBe(stopCount);
		});
	}
});

test.describe('mobile keyboard navigation', () => {
	test.beforeEach(({ isMobile }) => {
		test.skip(!isMobile, 'only the mobile navbar has a menu button');
	});

	test('the menu button opens and closes the nav by keyboard', async ({
		page
	}) => {
		await page.goto('/');
		const newsLink = page
			.locator('nav')
			.getByRole('link', { name: 'News' });
		await expect(newsLink).toBeHidden();

		await page.locator('.hamburger-menu-button').focus();
		await page.keyboard.press('Enter');
		await expect(newsLink).toBeVisible();

		await page.locator('.close-hamburger-menu-button').focus();
		await page.keyboard.press('Enter');
		await expect(newsLink).toBeHidden();
	});
});
