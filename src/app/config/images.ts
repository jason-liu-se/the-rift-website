/**
 * Widths (px) that optimised images are offered at in their `srcset`. Each
 * image and width the browser asks for is one Cloudflare transformation (5,000
 * unique a month on the Free plan), so keep this list short.
 */
export const IMAGE_BREAKPOINTS = [384, 640, 1080, 1920];
