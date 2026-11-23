// Edit links on public content: editors only, opening the item's admin tool.
import {
	DOWNLOAD_COLLECTIONS,
	GALLERY_COLLECTIONS,
	MAP_SEASONS,
	NEWS_POSTS
} from '../src/app/testing/api-fixtures';
import { signIn } from './support/auth';
import { scanForViolations, violationKey } from './support/axe';
import { KNOWN_A11Y_ISSUES } from './known-a11y-issues';
import { expect, test } from './support/test';

const PAGES = [
	{
		path: '/news',
		name: NEWS_POSTS[0].title,
		href: `/admin?edit=${NEWS_POSTS[0].id}#news`
	},
	{
		path: '/gallery/season5',
		name: GALLERY_COLLECTIONS[0].images[0].caption,
		href: `/admin?edit=${GALLERY_COLLECTIONS[0].images[0].id}#gallery`
	},
	{
		path: '/downloads',
		name: DOWNLOAD_COLLECTIONS[0].items[0].title,
		href: `/admin?edit=${DOWNLOAD_COLLECTIONS[0].items[0].id}#downloads`
	},
	{
		path: '/map',
		name: `Season ${MAP_SEASONS[0].season}`,
		href: `/admin?edit=${MAP_SEASONS[0].id}#maps`
	}
];

for (const { path, name, href } of PAGES) {
	test(`${path} offers editors an Edit link to the item's tool, in a new tab`, async ({
		page
	}) => {
		await signIn(page);
		await page.goto(path);

		const link = page.getByRole('link', {
			name: `Edit ${name} (opens in new tab)`,
			exact: true
		});
		await expect(link).toHaveAttribute('href', href);
		await expect(link).toHaveAttribute('target', '_blank');
		// Known issues are tracked (and checked) by accessibility.spec.ts.
		const known = new Set(KNOWN_A11Y_ISSUES.map(violationKey));
		const violations = await scanForViolations(page);
		expect(violations.filter((v) => !known.has(violationKey(v)))).toEqual(
			[]
		);
	});

	test(`${path} shows visitors no Edit links`, async ({ page }) => {
		await page.goto(path, { waitUntil: 'networkidle' });

		await expect(page.getByRole('link', { name: /^Edit / })).toHaveCount(0);
	});
}
