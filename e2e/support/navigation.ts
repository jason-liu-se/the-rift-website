import { Page } from '@playwright/test';
import { IE2eRoute } from './routes';
import { expect } from './test';

// Opens a route and waits until it's ready to inspect. Failing the title
// check means the wrong page rendered (e.g. the 404 page after a route was
// renamed) or the app didn't start, rather than letting later checks pass on
// an empty page.
export async function gotoRoute(page: Page, route: IE2eRoute): Promise<void> {
	await page.goto(route.path);
	await expect(page).toHaveTitle(route.title);

	if (route.readyText) {
		await expect(page.getByText(route.readyText).first()).toBeVisible();
	}

	// Late fonts and images change layout, contrast, and screenshots.
	await page.evaluate(() => document.fonts.ready.then(() => undefined));
	await page.waitForFunction(() =>
		Array.from(document.images).every((image) => image.complete)
	);
}
