// Accessibility violations that already existed when the axe suite was added.
// They are real bugs to fix, listed here so only NEW violations fail the
// suite. When you fix one, delete its entry: the suite also fails on entries
// that no longer occur, so this list can't go stale.
import { IA11yViolation } from './support/axe';

export interface IKnownA11yIssue extends Omit<IA11yViolation, 'help'> {
	// Route paths (from support/routes.ts) it occurs on; omit for every route.
	routes?: readonly string[];
	// Playwright projects it occurs on; omit for every project.
	projects?: readonly string[];
	note: string;
}

const BLUEMAP_ROUTE = '/map/season-5-overworld';
const OPAQUE_NAVBAR_NOTE =
	'Nav link text fails 4.5:1 contrast on the opaque navbar background.';

export const KNOWN_A11Y_ISSUES: readonly IKnownA11yIssue[] = [
	{
		ruleId: 'button-name',
		target: '.hamburger-menu-button',
		projects: ['mobile'],
		note: 'Icon-only menu button needs an aria-label.'
	},
	{
		ruleId: 'button-name',
		target: '.tip-pop-up > .message-exit-button',
		routes: [BLUEMAP_ROUTE],
		note: 'Icon-only close button on the BlueMap tip needs an aria-label.'
	},
	{
		ruleId: 'button-name',
		target: '.control-pop-up > .message-exit-button',
		routes: [BLUEMAP_ROUTE],
		note: 'Icon-only close button on the BlueMap controls tip needs an aria-label.'
	},
	{
		ruleId: 'frame-title',
		target: 'iframe',
		routes: [BLUEMAP_ROUTE],
		note: 'BlueMap iframe needs a title.'
	},
	{
		ruleId: 'color-contrast',
		target: '.link-active > p',
		routes: ['/join', '/not-a-page'],
		projects: ['desktop'],
		note: OPAQUE_NAVBAR_NOTE
	},
	{
		ruleId: 'color-contrast',
		target: '.link-active[routerlink="/"][href="/"] > p',
		routes: ['/news', BLUEMAP_ROUTE],
		projects: ['desktop'],
		note: `${OPAQUE_NAVBAR_NOTE} Also, the Home link is marked active on every page because its routerLinkActive lacks exact matching.`
	},
	{
		ruleId: 'color-contrast',
		target: 'a[routerlink="/news"] > p',
		routes: ['/news'],
		projects: ['desktop'],
		note: OPAQUE_NAVBAR_NOTE
	},
	{
		ruleId: 'color-contrast',
		target: 'a[routerlink="/map"] > p',
		routes: [BLUEMAP_ROUTE],
		projects: ['desktop'],
		note: OPAQUE_NAVBAR_NOTE
	}
];
