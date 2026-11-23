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
		page.getByRole('checkbox', { name: `Select ${firstItem}`, exact: true })
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

test.describe('news editor', () => {
	test.beforeEach(({ page }) =>
		openTool(page, 'news', EDITOR_NEWS_POSTS[0].title)
	);

	test('writes a new post, autosaves it, and publishes it', async ({
		page
	}) => {
		const saves: unknown[] = [];
		await page.route(`${API_URL}/editor/drafts/*`, (route) => {
			saves.push(route.request().postDataJSON());
			route.fulfill({
				status: 201,
				json: {
					id: route.request().url().split('/').pop(),
					type: 'news',
					fields: {},
					revision: saves.length,
					createdAt: '2026-01-01T00:00:00.000Z',
					updatedAt: '2026-01-01T00:00:00.000Z'
				}
			});
		});
		let publishRequest: unknown;
		await page.route(`${API_URL}/editor/drafts/*/publish`, (route) => {
			publishRequest = route.request().postDataJSON();
			route.fulfill({
				json: { ...EDITOR_NEWS_POSTS[0], title: 'Fresh' }
			});
		});

		await page.getByRole('button', { name: 'New post' }).click();
		await expect(
			page.getByRole('heading', { name: 'New post' })
		).toBeFocused();
		await page.getByRole('textbox', { name: 'Title' }).fill('Fresh');
		await page
			.getByRole('textbox', { name: 'Content' })
			.fill('Hello **all**');

		await expect(
			page.getByRole('status').filter({ hasText: /^Saved$/ })
		).toBeVisible();
		await expect(page).toHaveURL(/\?draft=[\w-]+#news$/);
		expect(saves.at(-1)).toEqual({
			type: 'news',
			fields: { title: 'Fresh', content: 'Hello **all**' }
		});
		expect(await scanForViolations(page)).toEqual([]);

		await page.getByRole('button', { name: 'Publish' }).click();
		await expect(page.getByText('Published Fresh.')).toBeVisible();
		expect(publishRequest).toEqual({ visible: true, date: 'now' });
		await expect(page).toHaveURL(/\/admin#news$/);
	});

	test('opens a post to edit with its fields, and makes no draft until it changes', async ({
		page
	}) => {
		const saves: string[] = [];
		page.on('request', (request) => {
			if (request.method() === 'PUT') {
				saves.push(request.url());
			}
		});

		await page
			.getByRole('button', {
				name: `Edit ${EDITOR_NEWS_POSTS[1].title}`,
				exact: true
			})
			.click();

		await expect(page).toHaveURL(/\?edit=news-2#news$/);
		await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue(
			EDITOR_NEWS_POSTS[1].title
		);
		await expect(page.getByLabel('Keep its date')).toBeChecked();
		await page.waitForTimeout(500);
		expect(saves).toEqual([]);
	});
});

test.describe('gallery collections', () => {
	test.beforeEach(async ({ page }) => {
		await openTool(page, 'gallery', 'Spawn walkway');
		await page.getByRole('button', { name: 'Collections' }).click();
		await expect(
			page.getByRole('heading', { name: 'Collections' })
		).toBeVisible();
		await expect(
			page.getByText('Season 5', { exact: true }).first()
		).toBeVisible();
	});

	test('has no WCAG 2.2 AA violations', async ({ page }) => {
		expect(await scanForViolations(page)).toEqual([]);
	});

	test('creates a collection from a title and a valid slug', async ({
		page
	}) => {
		let body: unknown;
		await page.route(`${API_URL}/editor/gallery/collections`, (route) => {
			if (route.request().method() !== 'POST') {
				return route.fallback();
			}
			body = route.request().postDataJSON();
			return route.fulfill({ status: 201, json: {} });
		});
		await page.getByRole('textbox', { name: 'Title' }).fill('Season 7');
		await page.getByRole('textbox', { name: /Slug/ }).fill('Season 7');
		await expect(page.getByText('Use lowercase letters')).toBeVisible();

		await page.getByRole('textbox', { name: /Slug/ }).fill('season-7');
		await page.getByRole('button', { name: 'Create collection' }).click();

		await expect(page.getByText('Created Season 7.')).toBeVisible();
		expect(body).toEqual({
			slug: 'season-7',
			title: 'Season 7',
			visible: true
		});
	});
});

test.describe('gallery images', () => {
	test.beforeEach(({ page }) => openTool(page, 'gallery', 'Spawn walkway'));

	test('moves the selection to another collection in one request', async ({
		page
	}) => {
		let body: unknown;
		await page.route(`${API_URL}/editor/gallery/images/bulk`, (route) => {
			body = route.request().postDataJSON();
			route.fulfill({
				json: { results: [{ id: 'iron-farm-1.webp', outcome: 'ok' }] }
			});
		});
		await page
			.getByRole('checkbox', { name: 'Select Iron farm', exact: true })
			.check();
		await page.getByRole('combobox', { name: 'Move to' }).click();
		await page.getByRole('option', { name: 'Season 6' }).click();
		await page.getByRole('button', { name: 'Move', exact: true }).click();

		await expect(page.getByText('Moved 1 image.')).toBeVisible();
		expect(body).toEqual({
			action: 'move',
			collection: 'season6',
			items: [{ id: 'iron-farm-1.webp', startingRevision: 2 }]
		});
	});

	test('adds many images from pasted links, and publishes them together', async ({
		page
	}) => {
		let body:
			{ items: { createId: string; caption: string }[] } | undefined;
		await page.route(`${API_URL}/editor/gallery/images/bulk`, (route) => {
			body = route.request().postDataJSON();
			route.fulfill({
				json: {
					results: body!.items.map(({ createId }) => ({
						id: createId,
						outcome: 'ok'
					}))
				}
			});
		});
		await page.getByRole('button', { name: 'Add many images' }).click();
		await page
			.getByRole('textbox', { name: 'Or paste links, one per line' })
			.fill('https://i.ibb.co/a/one.png\nhttps://i.ibb.co/a/two.png');
		await page.getByRole('button', { name: 'Add links' }).click();
		await page
			.getByRole('combobox', { name: 'Collection', exact: true })
			.click();
		await page.getByRole('option', { name: 'Season 5' }).click();
		await page
			.getByRole('textbox', { name: 'Caption for image 1' })
			.fill('One');
		await page
			.getByRole('textbox', { name: 'Caption for image 2' })
			.fill('Two');
		expect(await scanForViolations(page)).toEqual([]);

		await page
			.getByRole('button', { name: 'Upload and publish 2 images' })
			.click();

		await expect(page.getByText('Published 2 images.')).toBeVisible();
		expect(body?.items.map(({ caption }) => caption)).toEqual([
			'One',
			'Two'
		]);
		await expect(
			page.getByText('Pick files or paste links to start.')
		).toBeVisible();
	});
});

test.describe('downloads', () => {
	test.beforeEach(({ page }) =>
		openTool(page, 'downloads', 'World download')
	);

	test('edits a download with a preview, and has no WCAG 2.2 AA violations', async ({
		page
	}) => {
		await page
			.getByRole('button', { name: 'Edit World download', exact: true })
			.click();

		await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue(
			'World download'
		);
		await page
			.getByRole('textbox', { name: 'Title' })
			.fill('Season 5 world');
		await expect(
			page
				.locator('.preview')
				.getByRole('heading', { name: 'Season 5 world' })
		).toBeVisible();
		expect(await scanForViolations(page)).toEqual([]);
	});
});
