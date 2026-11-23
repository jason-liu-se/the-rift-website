// The admin tools, logged in with the mock API's editor.
import { Page } from '@playwright/test';
import { environment } from '../src/environments/environment.development';
import { EDITOR_NEWS_POSTS } from '../src/app/testing/api-fixtures';
import { signIn } from './support/auth';
import { scanForViolations } from './support/axe';
import { expect, test } from './support/test';

const { API_URL } = environment;

/** Opens a tool once its list has loaded. */
async function openTool(page: Page, tool: string, firstItem: string) {
	await signIn(page);
	await page.goto(`/admin#${tool}`);
	await expect(
		page.getByRole('cell', { name: firstItem, exact: true })
	).toBeVisible();
}

test.describe('news list', () => {
	test.beforeEach(({ page }) =>
		openTool(page, 'news', EDITOR_NEWS_POSTS[0].title)
	);

	test('has no WCAG 2.2 AA violations', async ({ page }) => {
		expect(await scanForViolations(page)).toEqual([]);
	});

	test('shows each status, including a scheduled post', async ({ page }) => {
		await expect(page.getByText('Scheduled').first()).toBeVisible();
		await expect(page.getByText('Live').first()).toBeVisible();
	});

	test('selects the page by keyboard with Ctrl+A, then Enter', async ({
		page
	}) => {
		await page
			.getByRole('checkbox', {
				name: `Select ${EDITOR_NEWS_POSTS[0].title}`,
				exact: true
			})
			.focus();
		await page.keyboard.press('Control+a');
		await expect(
			page.getByText('Select all 13 posts on this page?')
		).toBeVisible();

		await page.keyboard.press('Enter');
		await expect(page.getByText('13 of 13 selected').first()).toBeVisible();
		// The bulk action bar, too.
		expect(await scanForViolations(page)).toEqual([]);

		await page.keyboard.press('Escape');
		await expect(page.getByText('13 of 13 selected')).toHaveCount(0);
	});

	test('hides the selection in one request and confirms it', async ({
		page
	}) => {
		let body: unknown;
		await page.route(`${API_URL}/editor/news/bulk`, (route) => {
			body = route.request().postDataJSON();
			route.fulfill({
				json: { results: [{ id: 'news-1', outcome: 'ok' }] }
			});
		});
		await page
			.getByRole('checkbox', {
				name: `Select ${EDITOR_NEWS_POSTS[0].title}`,
				exact: true
			})
			.check();
		await page.getByRole('button', { name: 'Hide', exact: true }).click();

		await expect(page.getByText('Hid 1 post.')).toBeVisible();
		expect(body).toEqual({
			action: 'hide',
			items: [{ id: 'news-1', startingRevision: 1 }]
		});
	});
});
