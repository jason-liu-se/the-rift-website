import { ImageLoader } from '@angular/common';

/** Serves the original file at every width: no transformation. */
export const originalImageLoader: ImageLoader = ({ src }) => src;

/**
 * Resizes an image to each `srcset` width, as WebP or AVIF, with Cloudflare
 * image transformations (on this site's zone; other hosts must be allowed
 * under Transformations > Sources). `src` stays the original, which
 * `ImageFallbackDirective` falls back to when a transformation fails.
 *
 * Unlike Angular's `provideCloudflareLoader`, this accepts absolute URLs, since
 * the API's images are on other hosts.
 */
export const cloudflareImageLoader: ImageLoader = ({ src, width }) => {
	if (!width) {
		return src;
	}

	// Root-relative sources are given without their leading slash.
	const source = src.replace(/^\//, '');
	return `/cdn-cgi/image/format=auto,width=${width},onerror=redirect/${source}`;
};
