import AxeBuilder from '@axe-core/playwright';
import { Page } from '@playwright/test';

// axe rule tags for WCAG 2.2 level A and AA (each WCAG version adds rules;
// 2.2 added no level A rules that axe automates). Selecting by tag also runs
// rules axe disables by default, such as 2.2's 24x24px `target-size`.
const WCAG_22_AA_TAGS = [
	'wcag2a',
	'wcag2aa',
	'wcag21a',
	'wcag21aa',
	'wcag22aa'
];

export interface IA11yViolation {
	ruleId: string;
	// CSS selector of the failing element; frames are joined with ' >> '.
	target: string;
	help?: string;
}

export const violationKey = ({ ruleId, target }: IA11yViolation): string =>
	`${ruleId} | ${target}`;

export async function scanForViolations(page: Page): Promise<IA11yViolation[]> {
	const results = await new AxeBuilder({ page })
		.withTags(WCAG_22_AA_TAGS)
		.analyze();

	return results.violations.flatMap((violation) =>
		violation.nodes.map((node) => ({
			ruleId: violation.id,
			target: node.target.join(' >> '),
			help: `${violation.help} (${violation.helpUrl})`
		}))
	);
}
