import { NgOptimizedImage } from '@angular/common';
import {
	Component,
	ElementRef,
	InjectionToken,
	afterNextRender,
	booleanAttribute,
	computed,
	inject,
	input,
	untracked,
	viewChild
} from '@angular/core';
import { IMAGE_WIDTHS } from 'src/app/core/config/images';

/** `480w, 960w, 1920w`: the only widths an image is offered at. */
const SRCSET = Object.values(IMAGE_WIDTHS)
	.map((width) => `${width}w`)
	.join(', ');

/**
 * Sources whose resized versions failed on this page load. Later images with
 * the same source start on the original, because the browser can mark a URL
 * that already failed as broken again without firing `error`, so
 * `useOriginal()` would never run (seen in Chrome after navigating back to a
 * page).
 */
const FAILED_SOURCES = new InjectionToken('FAILED_SOURCES', {
	providedIn: 'root',
	factory: () => new Set<string>()
});

/**
 * An image resized to WebP by Cloudflare (see `cloudflareImageLoader`), which
 * fills its nearest positioned ancestor. Style it from the parent with
 * `--image-fit` (default `cover`) and `--image-position` (default `center`).
 *
 * If the resized versions fail, e.g. once the month's free transformations run
 * out (`onerror=redirect` only rescues images on this site's domain), it shows
 * the original file instead.
 */
@Component({
	selector: 'app-optimized-image',
	imports: [NgOptimizedImage],
	templateUrl: './optimized-image.html',
	styleUrl: './optimized-image.scss'
})
export class OptimizedImage {
	public readonly src = input.required<string>();
	public readonly alt = input('');
	/** Load first and eagerly: for the page's largest image above the fold (LCP). */
	public readonly priority = input(false, { transform: booleanAttribute });
	/** Serve the original file, unresized: for full-screen views. */
	public readonly original = input(false, { transform: booleanAttribute });
	/** How wide the image shows, as in `<img sizes>`, so a small one loads small. */
	public readonly sizes = input('100vw');

	protected readonly srcset = SRCSET;
	private readonly failedSources = inject(FAILED_SOURCES);
	/**
	 * Read once: `NgOptimizedImage` doesn't allow `loaderParams` to change after
	 * init, so neither a later failure nor a new `src` may flip it.
	 */
	protected readonly serveOriginal = computed(
		() => this.original() || this.failedSources.has(untracked(this.src))
	);

	private readonly image =
		viewChild.required<ElementRef<HTMLImageElement>>('image');

	constructor() {
		// A server-rendered image can fail before hydration adds the listener.
		afterNextRender(() => {
			const image = this.image().nativeElement;
			if (image.complete && image.naturalWidth === 0) {
				this.useOriginal();
			}
		});
	}

	/** Without `srcset`, the browser loads `src`: the original file. */
	protected useOriginal(): void {
		if (!this.original()) {
			this.failedSources.add(this.src());
		}
		this.image().nativeElement.removeAttribute('srcset');
	}
}
