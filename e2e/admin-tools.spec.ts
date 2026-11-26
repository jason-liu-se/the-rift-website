// The admin tools, logged in with the mock API's editor.
import { Page } from '@playwright/test';
import { environment } from '../src/environments/environment.development';
import {
	EDITOR_GALLERY_IMAGES,
	EDITOR_NEWS_POSTS
} from '../src/app/testing/api-fixtures';
import { signIn } from './support/auth';
import { scanForViolations } from './support/axe';
import { expect, test } from './support/test';

const { API_URL } = environment;

/** Opens a tool once its list has loaded. */
async function openTool(page: Page, tool: string, firstItem: string) {
	await signIn(page);
	await page.goto(`/admin/${tool}`);
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

	test("opens a row's menu on a right-click anywhere on it", async ({
		page
	}) => {
		await page
			.getByRole('row')
			.filter({ hasText: EDITOR_NEWS_POSTS[0].title })
			.getByRole('cell')
			.last()
			.click({ button: 'right' });

		await expect(
			page.getByRole('menuitem', { name: 'Duplicate' })
		).toBeVisible();
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
			page.getByRole('paragraph').filter({
				hasText: 'Select all 13 posts on this page?'
			})
		).toBeVisible();

		await page.keyboard.press('Enter');
		await expect(page.getByText('13 selected').first()).toBeVisible();
		// The bulk action bar, too.
		expect(await scanForViolations(page)).toEqual([]);

		await page.keyboard.press('Escape');
		await expect(page.getByText('13 selected')).toHaveCount(0);
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
		await page.getByRole('button', { name: /^Hide/ }).click();

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

		await page.getByRole('link', { name: 'New post' }).click();
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
		await expect(page).toHaveURL(/\/admin\/news\/drafts\/[\w-]+$/);
		expect(saves.at(-1)).toEqual({
			type: 'news',
			fields: { title: 'Fresh', content: 'Hello **all**', visible: true }
		});
		expect(await scanForViolations(page)).toEqual([]);

		await page
			.getByRole('button', { name: 'Publish', exact: true })
			.click();
		await expect(page.getByText('Published Fresh.')).toBeVisible();
		// The draft holds the publish choices.
		expect(publishRequest).toEqual({});
		await expect(page).toHaveURL(/\/admin\/news$/);
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
			.getByRole('row')
			.filter({ hasText: EDITOR_NEWS_POSTS[1].title })
			.click();

		await expect(page).toHaveURL(/\/admin\/news\/news-2$/);
		await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue(
			EDITOR_NEWS_POSTS[1].title
		);
		await expect(page.getByLabel(/^As before/)).toBeChecked();
		await page.waitForTimeout(500);
		expect(saves).toEqual([]);
	});
});

test('keeps editing offline, and saves the draft once the API is back', async ({
	page,
	context
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
				revision: 1,
				createdAt: '2026-01-01T00:00:00.000Z',
				updatedAt: '2026-01-01T00:00:00.000Z'
			}
		});
	});
	await openTool(page, 'news', EDITOR_NEWS_POSTS[0].title);
	await page.getByRole('link', { name: 'New post' }).click();

	await context.setOffline(true);
	await page.getByRole('textbox', { name: 'Title' }).fill('Written offline');
	await expect(page.getByText('Saved in this browser')).toBeVisible();
	expect(saves).toEqual([]);

	await context.setOffline(false);
	await expect(
		page.getByRole('status').filter({ hasText: /^Saved$/ })
	).toBeVisible();
	expect(saves).toEqual([
		{ type: 'news', fields: { title: 'Written offline', visible: true } }
	]);
});

test('opens an item from its link (an Edit button) over its list, and Back closes it', async ({
	page
}) => {
	await signIn(page);
	await page.goto('/admin/news');
	await page.goto(`/admin/news/${EDITOR_NEWS_POSTS[1].id}`);

	const editor = page.getByRole('dialog');
	await expect(editor.getByRole('textbox', { name: 'Title' })).toHaveValue(
		EDITOR_NEWS_POSTS[1].title
	);
	await page.reload();
	await expect(editor.getByRole('textbox', { name: 'Title' })).toHaveValue(
		EDITOR_NEWS_POSTS[1].title
	);

	await page.goBack();
	await expect(page).toHaveURL(/\/admin\/news$/);
	await expect(editor).toHaveCount(0);
	await expect(
		page.getByRole('checkbox', {
			name: `Select ${EDITOR_NEWS_POSTS[0].title}`,
			exact: true
		})
	).toBeVisible();
});

test.describe('gallery collections', () => {
	test.beforeEach(async ({ page }) => {
		await openTool(page, 'gallery', 'Spawn walkway');
		await page.getByRole('link', { name: 'Collections' }).click();
		await expect(page).toHaveURL(/\/admin\/gallery\/collections$/);
		await expect(
			page.getByRole('heading', { name: 'Gallery collections' })
		).toBeFocused();
		await expect(
			page.getByRole('button', { name: 'Season 5', exact: true })
		).toBeVisible();
	});

	test('has no WCAG 2.2 AA violations', async ({ page }) => {
		expect(await scanForViolations(page)).toEqual([]);
	});

	test('drafts a new collection, its slug following the title, and publishes it', async ({
		page
	}) => {
		const saves: { fields: object }[] = [];
		await page.route(`${API_URL}/editor/drafts/*`, (route) => {
			const save = route.request().postDataJSON();
			saves.push(save);
			return route.fulfill({
				status: 201,
				json: {
					...save,
					id: route.request().url().split('/').pop(),
					revision: saves.length,
					createdAt: '2026-01-01T00:00:00.000Z',
					updatedAt: '2026-01-01T00:00:00.000Z'
				}
			});
		});
		await page.route(`${API_URL}/editor/drafts/*/publish`, (route) =>
			route.fulfill({ json: { slug: 'season-7', title: 'Season 7' } })
		);
		await page
			.getByRole('textbox', { name: 'Title', exact: true })
			.fill('Season 7');
		await expect(page.getByRole('textbox', { name: 'Slug' })).toHaveValue(
			'season-7'
		);
		await page.getByRole('button', { name: 'Publish' }).click();

		await expect(page.getByText('Published Season 7.')).toBeVisible();
		expect(saves.at(-1)?.fields).toEqual({
			slug: 'season-7',
			title: 'Season 7',
			visible: true
		});
	});
});

test.describe('gallery images', () => {
	test.beforeEach(({ page }) => openTool(page, 'gallery', 'Spawn walkway'));

	test("copies a card's image link from its right-click menu", async ({
		page,
		context
	}) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		const image = EDITOR_GALLERY_IMAGES.find(
			({ caption }) => caption === 'Spawn walkway'
		)!;
		await page
			.getByRole('row')
			.filter({ hasText: 'Spawn walkway' })
			.locator('.main')
			.click({ button: 'right' });
		await page.getByRole('menuitem', { name: 'Copy image link' }).click();

		await expect(page.getByText('Image link copied')).toBeVisible();
		expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
			image.imageUrl
		);
	});

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
		await page.getByRole('button', { name: 'Move to' }).click();
		await page.getByRole('menuitem', { name: 'Season 6' }).click();

		await expect(page.getByText('Moved 1 image.')).toBeVisible();
		expect(body).toEqual({
			action: 'move',
			collection: 'season6',
			items: [{ id: 'iron-farm-1.webp', startingRevision: 2 }]
		});
	});

	test('asks before closing with images not yet published', async ({
		page
	}) => {
		await page.getByRole('link', { name: 'Upload images' }).click();
		await page.getByText('Add by link instead').click();
		await page
			.getByRole('textbox', {
				name: 'imgur or imgbb links, one per line'
			})
			.fill('https://i.ibb.co/a/one.png\nhttps://i.ibb.co/a/two.png');
		await page.getByRole('button', { name: 'Add links' }).click();

		await page.keyboard.press('Escape');
		const confirm = page.getByRole('alertdialog');
		await expect(confirm).toContainText('Close and drop 2 images?');
		await confirm.getByRole('button', { name: 'Cancel' }).click();
		await expect(page).toHaveURL(/\/admin\/gallery\/bulk$/);

		await page.goBack();
		await confirm.getByRole('button', { name: 'Drop 2 images' }).click();
		await expect(page).toHaveURL(/\/admin\/gallery$/);
		await expect(page.getByRole('dialog')).toHaveCount(0);
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
		await page.getByRole('link', { name: 'Upload images' }).click();
		await page.getByText('Add by link instead').click();
		await page
			.getByRole('textbox', {
				name: 'imgur or imgbb links, one per line'
			})
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
		await expect(page.getByText('No images yet.')).toBeVisible();
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
			.getByRole('row')
			.filter({ hasText: 'World download' })
			.click();

		await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue(
			'World download'
		);
		await page
			.getByRole('textbox', { name: 'Title' })
			.fill('Season 5 world');
		// On mobile, the preview is a tab beside the fields.
		const previewTab = page.getByRole('radio', { name: 'Preview' });
		if (await previewTab.isVisible()) {
			await previewTab.click();
		}
		await expect(page.locator('section.preview')).toContainText(
			'Season 5 world'
		);
		expect(await scanForViolations(page)).toEqual([]);
	});
});

test.describe('maps', () => {
	test.beforeEach(({ page }) => openTool(page, 'maps', 'Season 5'));

	test('starts the next season with three dimensions, reorderable by keyboard', async ({
		page
	}) => {
		await page.getByRole('link', { name: 'New season' }).click();
		await expect(
			page.getByRole('spinbutton', { name: 'Season' })
		).toHaveValue('6');
		const legends = page.locator('.dimension legend');
		await expect(legends).toHaveText(['Overworld', 'Nether', 'End']);
		expect(await scanForViolations(page)).toEqual([]);

		await page.getByRole('button', { name: 'Move down Overworld' }).focus();
		await page.keyboard.press('Enter');

		await expect(legends).toHaveText(['Nether', 'Overworld', 'End']);
		await expect(
			page.getByRole('button', { name: 'Move down Overworld' })
		).toBeFocused();
	});
});

test.describe('list quality of life', () => {
	test('keeps the filters after editing an item and coming back', async ({
		page
	}) => {
		await openTool(page, 'news', EDITOR_NEWS_POSTS[0].title);
		// On mobile, the filters other than search are behind a button.
		const moreFilters = page.getByRole('button', { name: /^Filters/ });
		if (await moreFilters.isVisible()) {
			await moreFilters.click();
		}
		await page.getByRole('combobox', { name: 'Status' }).click();
		await page.getByRole('option', { name: 'Live' }).click();
		await expect(page).toHaveURL(/[?&]status=live/);

		// A click anywhere on the row opens the post, like its Edit button.
		await page
			.getByRole('row')
			.filter({ hasText: 'News post 2 ' })
			.getByRole('cell', { name: 'Live' })
			.click();
		await expect(page).toHaveURL(/\/admin\/news\/news-2\?status=live$/);
		await page.getByRole('button', { name: 'Close', exact: true }).click();

		await expect(page).toHaveURL(/\/admin\/news\?status=live$/);
		await expect(
			page.getByRole('combobox', { name: 'Status' })
		).toContainText('Live');
	});

	test("shows a draft's image, and selects the draft", async ({ page }) => {
		await page.route(`${API_URL}/editor/drafts?type=gallery`, (route) =>
			route.fulfill({
				json: [
					{
						id: 'draft-1',
						type: 'gallery',
						fields: {
							caption: 'Draft image',
							imageUrl:
								'/assets/general-background-images/sunrise-1.webp'
						},
						revision: 1,
						createdAt: '2026-01-01T00:00:00.000Z',
						updatedAt: '2026-01-01T00:00:00.000Z'
					}
				]
			})
		);
		await openTool(page, 'gallery', 'Spawn walkway');

		const draftRow = page
			.getByRole('row')
			.filter({ hasText: 'Draft image' });
		await expect(draftRow.locator('img')).toHaveAttribute(
			'src',
			/sunrise-1\.webp$/
		);
		await page
			.getByRole('checkbox', { name: 'Select Draft image' })
			.check();
		await expect(page.getByText('1 selected').first()).toBeVisible();
	});
});
