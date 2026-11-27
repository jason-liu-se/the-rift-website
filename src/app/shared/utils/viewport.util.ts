import { DESKTOP_BREAKPOINT_REM } from '../../core/config/breakpoints';

/** Whether the window is at least as wide as the desktop breakpoint. */
export function isDesktopWidth(): boolean {
	const rootFontSize = parseFloat(
		getComputedStyle(document.documentElement).fontSize
	);

	return window.innerWidth >= DESKTOP_BREAKPOINT_REM * rootFontSize;
}
