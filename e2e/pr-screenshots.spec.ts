// Screenshots for a pull request, not a test: runs only when PR_SCREENSHOTS
// lists what to capture (playwright.config.ts ignores it otherwise), e.g.
//   PR_SCREENSHOTS='/news, /admin|.tool-nav' npm run e2e -- e2e/pr-screenshots.spec.ts
// Each entry is a route path, optionally `|<CSS selector>` to crop to one
// feature. Images go to test-results/pr-screenshots/; upload them with
// scripts/pr-screenshots/upload.mjs (.claude/rules/testing.md).
import { gotoRoute } from './support/navigation';
import { routeFor } from './support/routes';
import { test } from './support/test';

const OUTPUT_DIR = 'test-results/pr-screenshots';

const targets = (process.env['PR_SCREENSHOTS'] ?? '')
	.split(',')
	.map((entry) => entry.trim())
	.filter(Boolean)
	.map((entry) => {
		const [path, selector] = entry.split('|').map((part) => part.trim());
		return { path, selector };
	});

/** `/gallery/season5` → `gallery-season5`, `.navbar` → `navbar`, `/` → `home`. */
const slug = (text: string) =>
	text.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';

for (const { path, selector } of targets) {
	test(`screenshot ${path}${selector ? ` (${selector})` : ''}`, async ({
		page
	}, testInfo) => {
		await gotoRoute(page, routeFor(path));
		const file = `${OUTPUT_DIR}/${slug(path)}${
			selector ? `-${slug(selector)}` : ''
		}-${testInfo.project.name}.png`;

		await (selector ? page.locator(selector).first() : page).screenshot({
			path: file,
			animations: 'disabled'
		});
	});
}
