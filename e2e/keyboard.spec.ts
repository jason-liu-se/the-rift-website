import { Page } from '@playwright/test';
import { NEWS_POSTS } from '../src/app/testing/api-fixtures';
import {
	focused,
	focusedTabStop,
	markTabStops,
	screenshotAround
} from './support/keyboard';
import { gotoRoute } from './support/navigation';
import { TAG } from './support/projects';
import { ROUTES, routeFor } from './support/routes';
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

// Extra Tab presses allowed for focusable elements markTabStops can't see.
const MAX_UNMARKED_STOPS = 5;

const navItem = (page: Page, name: string) => {
	const nav = page.locator('nav');
	return nav
		.getByRole('link', { name, exact: true })
		.or(nav.getByRole('button', { name, exact: true }));
};

for (const route of ROUTES) {
	test(`${route.path}: Tab visits every focusable element once, in page order, then moves on`, async ({
		page
	}) => {
		await gotoRoute(page, route);
		const stopCount = await markTabStops(page);
		expect(stopCount).toBeGreaterThan(0);

		// Tab until focus wraps back to the first stop. A trap keeps focus
		// from wrapping; a positive tabindex or unreachable element breaks
		// the order.
		const visited: number[] = [];
		let wrapped = false;
		for (
			let press = 0;
			press <= stopCount + MAX_UNMARKED_STOPS && !wrapped;
			press++
		) {
			await page.keyboard.press('Tab');
			const stop = await focusedTabStop(page);
			if (stop === null) {
				continue;
			}
			wrapped = stop === 0 && visited.length > 0;
			if (!wrapped) {
				visited.push(stop);
			}
		}

		expect(visited).toEqual([...Array(stopCount).keys()]);
		expect(wrapped, 'focus should leave the last element').toBe(true);
	});
}

test.describe('desktop navbar', { tag: TAG.desktopOnly }, () => {
	test('Tab moves through the navbar in reading order with a visible focus indicator', async ({
		page
	}) => {
		// The news page's navbar is opaque, so only focus can change its pixels.
		await gotoRoute(page, routeFor('/news'));

		// Baselines are taken before any Tab press so a neighbour's focus
		// ring can't be mistaken for this element's.
		const unfocused = new Map<string, Buffer>();
		for (const name of NAVBAR_TAB_ORDER) {
			unfocused.set(
				name,
				await screenshotAround(page, navItem(page, name))
			);
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

		// Control: with focus removed, every item matches its baseline again,
		// so the differences above came from focus and not from the page
		// changing.
		await page.evaluate(() =>
			(document.activeElement as HTMLElement).blur()
		);
		for (const name of NAVBAR_TAB_ORDER) {
			expect(
				(await screenshotAround(page, navItem(page, name))).equals(
					unfocused.get(name)!
				),
				`"${name}" changed without focus`
			).toBe(true);
		}
	});

	test('Enter on a nav link opens that page and moves focus to its content', async ({
		page
	}) => {
		await gotoRoute(page, routeFor('/'));
		// A first page load leaves focus at the start of the document.
		await expect(page.locator('body')).toBeFocused();

		for (const name of NAVBAR_TAB_ORDER.slice(
			0,
			NAVBAR_TAB_ORDER.indexOf('News') + 1
		)) {
			await page.keyboard.press('Tab');
			await expect(focused(page)).toHaveAccessibleName(name);
		}
		await page.keyboard.press('Enter');

		const news = routeFor('/news');
		await expect(page).toHaveURL(news.path);
		await expect(page).toHaveTitle(news.title);
		await expect(page.locator('main')).toBeFocused();
		// Until the posts render, <main> has nothing focusable and Tab leaves it.
		await expect(page.getByText(news.readyText!).first()).toBeVisible();
		await page.keyboard.press('Tab');
		await expect(page.locator('main :focus')).toHaveCount(1);
	});

	test('Enter on the Next page button loads the second page of news', async ({
		page
	}) => {
		// Reaching this button by Tab is covered by the /news Tab test above.
		await gotoRoute(page, routeFor('/news'));
		await page.getByRole('button', { name: 'Next page' }).first().focus();

		await page.keyboard.press('Enter');

		await expect(
			page.getByText(NEWS_POSTS[10].title, { exact: true })
		).toBeVisible();
		await expect(page.getByText('Page 2 of 2').first()).toBeVisible();
	});
});

test.describe('mobile navbar menu', { tag: TAG.mobileOnly }, () => {
	const menuButton = (page: Page) =>
		page.locator('nav').getByRole('button', { name: 'Menu' });
	const newsLink = (page: Page) =>
		page.locator('nav').getByRole('link', { name: 'News' });

	async function openMenuByKeyboard(page: Page): Promise<void> {
		await gotoRoute(page, routeFor('/'));
		await expect(newsLink(page)).toBeHidden();

		await page.keyboard.press('Tab');
		await expect(menuButton(page)).toBeFocused();
		await expect(menuButton(page)).toHaveAttribute(
			'aria-expanded',
			'false'
		);
		await page.keyboard.press('Enter');
		await expect(newsLink(page)).toBeVisible();
		await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'true');
	}

	test('Tab reaches the menu button and Enter opens the menu, keeping focus', async ({
		page
	}) => {
		await openMenuByKeyboard(page);

		await expect(menuButton(page)).toBeFocused();
	});

	test('Enter on the menu button again closes the menu', async ({ page }) => {
		await openMenuByKeyboard(page);

		await page.keyboard.press('Enter');
		await expect(newsLink(page)).toBeHidden();
		await expect(menuButton(page)).toBeFocused();
	});

	test('Escape closes the menu and returns focus to the menu button', async ({
		page
	}) => {
		await openMenuByKeyboard(page);
		await page.keyboard.press('Tab');

		await page.keyboard.press('Escape');
		await expect(newsLink(page)).toBeHidden();
		await expect(menuButton(page)).toBeFocused();
	});
});
