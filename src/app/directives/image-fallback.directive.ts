import { NgOptimizedImage } from '@angular/common';
import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';

/**
 * Shows an optimised image's original file when its resized versions fail,
 * e.g. once the month's free Cloudflare transformations run out (new ones then
 * fail, and `onerror=redirect` only rescues images on this site's domain).
 * Removing `srcset` makes the browser load `src`, which `cloudflareImageLoader`
 * leaves as the original.
 */
@Directive({
	// Matches NgOptimizedImage's own selector, so no image can miss it.
	// eslint-disable-next-line @angular-eslint/directive-selector
	selector: 'img[ngSrc]',
	host: { '(error)': 'useOriginal()' }
})
export class ImageFallbackDirective {
	private readonly image =
		inject<ElementRef<HTMLImageElement>>(ElementRef).nativeElement;

	constructor() {
		// A server-rendered image can fail before hydration adds the listener.
		afterNextRender(() => {
			if (this.image.complete && this.image.naturalWidth === 0) {
				this.useOriginal();
			}
		});
	}

	protected useOriginal(): void {
		this.image.removeAttribute('srcset');
	}
}

/** Import this, not `NgOptimizedImage` alone, so images fall back. */
export const OPTIMIZED_IMAGE = [NgOptimizedImage, ImageFallbackDirective];
