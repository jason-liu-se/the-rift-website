import { DESKTOP_BREAKPOINT_REM } from '../config/breakpoints';

const ROOT_FONT_SIZE_PX = 16;
const INITIAL_INNER_WIDTH = window.innerWidth;

/** Desktop breakpoint in pixels, once `useRootFontSize()` has run. */
export const DESKTOP_BREAKPOINT_PX = DESKTOP_BREAKPOINT_REM * ROOT_FONT_SIZE_PX;

/** Gives the page a known root font size, since jsdom has none by default. */
export function useRootFontSize(): void {
	document.documentElement.style.fontSize = `${ROOT_FONT_SIZE_PX}px`;
}

/** jsdom ignores plain assignment to `window.innerWidth`. */
export function setInnerWidth(width: number): void {
	Object.defineProperty(window, 'innerWidth', {
		value: width,
		configurable: true,
		writable: true
	});
}

/** Restores the defaults changed by `useRootFontSize` and `setInnerWidth`. */
export function resetViewport(): void {
	document.documentElement.style.fontSize = '';
	setInnerWidth(INITIAL_INNER_WIDTH);
}
