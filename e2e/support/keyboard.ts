import { Locator, Page } from '@playwright/test';

const TAB_STOP_ATTRIBUTE = 'data-e2e-tab-stop';

// Marks every element a Tab press should reach (visible, enabled, not removed
// from the tab order) with its index in page order, and returns how many there
// are. Chromium can also focus scroll containers; those aren't marked, so
// callers must allow for extra, unmarked Tab stops. An iframe counts as one
// stop: focus inside it isn't followed.
export async function markTabStops(page: Page): Promise<number> {
	return page.evaluate((attribute) => {
		const candidates = document.querySelectorAll<HTMLElement>(
			'a[href], button, input, select, textarea, iframe, [tabindex]'
		);
		const stops = Array.from(candidates).filter(
			(element) =>
				element.tabIndex >= 0 &&
				!element.matches(':disabled') &&
				element.checkVisibility({ visibilityProperty: true })
		);
		stops.forEach((element, index) =>
			element.setAttribute(attribute, String(index))
		);
		return stops.length;
	}, TAB_STOP_ATTRIBUTE);
}

// The tab-stop index of the focused element, or null if it isn't one.
export async function focusedTabStop(page: Page): Promise<number | null> {
	const index = await page.evaluate(
		(attribute) => document.activeElement?.getAttribute(attribute) ?? null,
		TAB_STOP_ATTRIBUTE
	);
	return index === null ? null : Number(index);
}

export const focused = (page: Page): Locator => page.locator('*:focus');

// Focus rings are often drawn outside the element's box (the browser default
// is), so capture a margin around it rather than the element alone.
const FOCUS_RING_MARGIN_PX = 6;

export async function screenshotAround(
	page: Page,
	locator: Locator
): Promise<Buffer> {
	const box = await locator.boundingBox();
	if (!box) {
		throw new Error(`${locator} is not visible`);
	}
	return page.screenshot({
		animations: 'disabled',
		clip: {
			x: box.x - FOCUS_RING_MARGIN_PX,
			y: box.y - FOCUS_RING_MARGIN_PX,
			width: box.width + 2 * FOCUS_RING_MARGIN_PX,
			height: box.height + 2 * FOCUS_RING_MARGIN_PX
		}
	});
}
