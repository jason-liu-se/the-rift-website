import { DOCUMENT } from '@angular/common';
import { DestroyRef, afterNextRender, inject } from '@angular/core';

/**
 * Keeps `--scrollbar-gap` on <html> set to the page scrollbar's width while
 * it's hidden, and 0 while it shows (or where scrollbars float over the page),
 * so the page can keep the scrollbar's place (see scrollbar-gap.scss). The
 * width is measured on a hidden probe styled like the page scrollbar, as
 * there's none to measure while it's hidden. Browser only.
 */
export function publishScrollbarGap(): void {
	const document = inject(DOCUMENT);
	const destroyRef = inject(DestroyRef);

	afterNextRender(() => {
		const window = document.defaultView!;
		const root = document.documentElement;
		const probe = document.createElement('div');
		probe.className = 'scrollbar-probe';
		probe.setAttribute('aria-hidden', 'true');
		document.body.append(probe);

		const publish = () => {
			const scrollbarWidth = probe.offsetWidth - probe.clientWidth;
			const shownWidth = window.innerWidth - root.clientWidth;
			root.style.setProperty(
				'--scrollbar-gap',
				`${Math.max(0, scrollbarWidth - shownWidth)}px`
			);
		};
		// <html> narrows as the scrollbar appears and widens as it goes; resize
		// also covers zoom, which changes the scrollbar's width. Both run
		// before the next paint, so the layout never shows a shift.
		const observer = new ResizeObserver(publish);
		observer.observe(root);
		window.addEventListener('resize', publish);
		destroyRef.onDestroy(() => {
			observer.disconnect();
			window.removeEventListener('resize', publish);
			probe.remove();
		});
	});
}
