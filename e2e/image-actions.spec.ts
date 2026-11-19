import { readFile } from 'node:fs/promises';
import { gotoRoute } from './support/navigation';
import { TAG } from './support/projects';
import { routeFor } from './support/routes';
import { expect, test } from './support/test';

/** Every PNG file starts with these bytes. */
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

test.beforeEach(async ({ page }) => {
	await gotoRoute(page, routeFor('/gallery/season5'));
	await page.locator('.image-button').first().click();
});

// The PNG conversion needs a real browser canvas, which unit tests stub.
test(
	'Download PNG saves the WebP photo as a PNG',
	{ tag: TAG.desktopOnly },
	async ({ page }) => {
		const [download] = await Promise.all([
			page.waitForEvent('download'),
			page.getByRole('button', { name: 'Download PNG' }).click()
		]);

		expect(download.suggestedFilename()).toBe('spawn-walkway-1.png');
		const file = await readFile(await download.path());
		expect(file.subarray(0, 4)).toEqual(PNG_SIGNATURE);
	}
);

test(
	'Copy link copies the photo’s full URL',
	{ tag: TAG.desktopOnly },
	async ({ page, context, baseURL }) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);

		await page.getByRole('button', { name: 'Copy link' }).click();

		await expect(
			page.getByRole('button', { name: 'Copy link' })
		).toContainText('Copied');
		expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
			new URL(
				'/assets/general-background-images/spawn-walkway-1.webp',
				baseURL
			).href
		);
	}
);
