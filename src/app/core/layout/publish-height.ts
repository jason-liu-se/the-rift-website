import { DOCUMENT } from '@angular/common';
import { DestroyRef, afterNextRender, inject } from '@angular/core';

/**
 * Keeps a CSS variable on <html> set to an element's height, so other
 * layout (offsets, `scroll-padding-top`) can make room for a fixed bar.
 * Call from a component's constructor; it only runs in the browser.
 */
export function publishHeight(
	variable: string,
	element: () => HTMLElement
): void {
	const root = inject(DOCUMENT).documentElement;
	const destroyRef = inject(DestroyRef);

	afterNextRender(() => {
		const target = element();
		const observer = new ResizeObserver(() =>
			root.style.setProperty(variable, `${target.offsetHeight}px`)
		);
		observer.observe(target);
		destroyRef.onDestroy(() => observer.disconnect());
	});
}
