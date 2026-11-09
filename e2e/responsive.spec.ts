import { ROUTES } from './support/routes';
import { expect, test } from './support/test';

// 320px is WCAG's reflow width; 640px is a 1280px screen at 200% zoom.
const REFLOW_WIDTHS = [320, 640];
const VIEWPORT_HEIGHT = 800;

test.describe('reflow without horizontal scrolling', () => {
	test.beforeEach(({ isMobile }) => {
		test.skip(isMobile, 'viewport widths are set explicitly');
	});

	for (const width of REFLOW_WIDTHS) {
		for (const route of ROUTES) {
			test(`${route.path} at ${width}px`, async ({ page }) => {
				await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
				await page.goto(route.path);
				await page.waitForLoadState('networkidle');

				const { scrollWidth, clientWidth } = await page.evaluate(
					() => ({
						scrollWidth: document.documentElement.scrollWidth,
						clientWidth: document.documentElement.clientWidth
					})
				);
				expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
			});
		}
	}
});
