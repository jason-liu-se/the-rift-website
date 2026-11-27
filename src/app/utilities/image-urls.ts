import { IMAGE_URL_PREFIXES } from '../core/config/images';

/** Whether the API will accept `url` as an image: it's on the allowlist. */
export function isAllowedImageUrl(url: string): boolean {
	return IMAGE_URL_PREFIXES.some((prefix) => url.startsWith(prefix));
}
