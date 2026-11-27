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

/**
 * Every image URL editors save must start with one of these: a copy of the
 * API's allowlist (its src/config/images.ts), which is the one enforced. This
 * one flags bad links before saving, and keeps other images out of rendered
 * markdown. imgbb holds uploads; imgur the images added before uploads.
 */
export const IMAGE_URL_PREFIXES: readonly string[] = [
	'https://i.ibb.co/',
	'https://i.imgur.com/',
	'https://imgur.com/'
];
