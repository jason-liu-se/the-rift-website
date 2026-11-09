import { IKnownA11yIssue, KNOWN_A11Y_ISSUES } from './known-a11y-issues';
import { scanForViolations, violationKey } from './support/axe';
import { ROUTES } from './support/routes';
import { expect, test } from './support/test';

const appliesTo = (
	issue: IKnownA11yIssue,
	routePath: string,
	project: string
): boolean =>
	(!issue.routes || issue.routes.includes(routePath)) &&
	(!issue.projects || issue.projects.includes(project));

for (const route of ROUTES) {
	test(`${route.path} has no new WCAG 2.2 AA violations`, async ({
		page
	}, testInfo) => {
		await page.goto(route.path);
		await page.waitForLoadState('networkidle');

		const found = await scanForViolations(page);
		const known = KNOWN_A11Y_ISSUES.filter((issue) =>
			appliesTo(issue, route.path, testInfo.project.name)
		);
		const foundKeys = new Set(found.map(violationKey));
		const knownKeys = new Set(known.map(violationKey));

		expect(
			found.filter(
				(violation) => !knownKeys.has(violationKey(violation))
			),
			'new violations: fix them (or, if pre-existing, list them in known-a11y-issues.ts)'
		).toEqual([]);
		expect(
			known
				.filter((issue) => !foundKeys.has(violationKey(issue)))
				.map(violationKey),
			'known issues that no longer occur: remove them from known-a11y-issues.ts'
		).toEqual([]);
	});
}
