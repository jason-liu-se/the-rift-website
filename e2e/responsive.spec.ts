import { gotoRoute } from './support/navigation';
import { TAG } from './support/projects';
import { ROUTES } from './support/routes';
import { expect, test } from './support/test';

// 320px: WCAG's reflow width. 640px: a 1280px screen at 200% zoom (mobile
// layout). 960px: the navbar's 60rem desktop breakpoint (navbar.component.scss)
// at the default font size, i.e. a 1920px screen at 200% zoom, where the
// desktop layout is at its narrowest.
const REFLOW_WIDTHS = [320, 640, 960];
const VIEWPORT_HEIGHT = 800;

test.describe(
	'reflow without horizontal scrolling',
	{ tag: TAG.desktopOnly },
	() => {
		for (const width of REFLOW_WIDTHS) {
			for (const route of ROUTES) {
				test(`${route.path} at ${width}px`, async ({ page }) => {
					await page.setViewportSize({
						width,
						height: VIEWPORT_HEIGHT
					});
					await gotoRoute(page, route);

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
	}
);
