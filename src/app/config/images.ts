/**
 * The only widths (px) optimised images are resized to. Each image and width
 * a browser asks for is one Cloudflare transformation (5,000 unique a month on
 * the Free plan), so keep this list short.
 */
export const IMAGE_WIDTHS = {
	mobile: 480,
	tablet: 960,
	desktop: 1920
} as const;
