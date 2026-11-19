import { ImageLoader } from '@angular/common';
import { IMAGE_WIDTHS } from '../config/images';

const ALLOWED_WIDTHS = Object.values(IMAGE_WIDTHS);

/** Serves the original file at every width: no transformation. */
export const originalImageLoader: ImageLoader = ({ src }) => src;

/**
 * Resizes an image to WebP at one of `IMAGE_WIDTHS` (the smallest that covers
 * the requested width), with Cloudflare image transformations on this site's
 * zone; other hosts must be allowed under Transformations > Sources.
 *
 * Returns the original file for `src` (no width), which
 * `OptimizedImageComponent` falls back to when a transformation fails, and for
 * every width when `loaderParams.original` is set.
 *
 * Unlike Angular's `provideCloudflareLoader`, this accepts absolute URLs, since
 * the API's images are on other hosts.
 */
export const cloudflareImageLoader: ImageLoader = ({
	src,
	width,
	loaderParams
}) => {
	if (!width || loaderParams?.['original']) {
		return src;
	}

	const allowedWidth =
		ALLOWED_WIDTHS.find((allowed) => allowed >= width) ??
		IMAGE_WIDTHS.desktop;
	// Root-relative sources are given without their leading slash.
	const source = src.replace(/^\//, '');
	return `/cdn-cgi/image/format=webp,width=${allowedWidth},onerror=redirect/${source}`;
};
