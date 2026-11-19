import { NgOptimizedImage } from '@angular/common';
import {
	Component,
	ElementRef,
	afterNextRender,
	booleanAttribute,
	input,
	output,
	viewChild
} from '@angular/core';
import { IMAGE_WIDTHS } from 'src/app/config/images';

export interface ImageSize {
	width: number;
	height: number;
}

/** `480w, 960w, 1920w`: the only widths an image is offered at. */
const SRCSET = Object.values(IMAGE_WIDTHS)
	.map((width) => `${width}w`)
	.join(', ');

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
	templateUrl: './optimized-image.component.html',
	styleUrl: './optimized-image.component.scss'
})
export class OptimizedImageComponent {
	public readonly src = input.required<string>();
	public readonly alt = input('');
	/** Load first and eagerly: for the page's largest image above the fold (LCP). */
	public readonly priority = input(false, { transform: booleanAttribute });
	/** Serve the original file, unresized: for full-screen views. */
	public readonly original = input(false, { transform: booleanAttribute });
	/** How wide the image shows, as in `<img sizes>`, so a small one loads small. */
	public readonly sizes = input('100vw');
	/** The loaded file's natural size, e.g. to fit a frame to the image. */
	public readonly loaded = output<ImageSize>();

	protected readonly srcset = SRCSET;

	private readonly image =
		viewChild.required<ElementRef<HTMLImageElement>>('image');

	constructor() {
		// A server-rendered image can load or fail before hydration adds the
		// listeners.
		afterNextRender(() => {
			const image = this.image().nativeElement;
			if (!image.complete) {
				return;
			}
			if (image.naturalWidth === 0) {
				this.useOriginal();
			} else {
				this.emitLoaded();
			}
		});
	}

	protected emitLoaded(): void {
		const { naturalWidth, naturalHeight } = this.image().nativeElement;
		// An SVG without intrinsic dimensions loads with a 0 size.
		if (naturalWidth > 0 && naturalHeight > 0) {
			this.loaded.emit({ width: naturalWidth, height: naturalHeight });
		}
	}

	/** Without `srcset`, the browser loads `src`: the original file. */
	protected useOriginal(): void {
		this.image().nativeElement.removeAttribute('srcset');
	}
}
