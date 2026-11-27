/** The site's pages; each must match its path in app.routes.ts (a test checks). */
export const HOME_PATH = '/';
export const NEWS_PATH = '/news';
export const GALLERY_PATH = '/gallery';
export const MAP_PATH = '/map';
export const MAP_VIEWER_PATH = '/map/viewer';
export const DOWNLOADS_PATH = '/downloads';
export const ABOUT_PATH = '/about';
export const CONTACT_PATH = '/contact';
export const JOIN_PATH = '/join';
export const ADMIN_PATH = '/admin';
export const ADMIN_LOGIN_PATH = '/admin/login';

/** A gallery collection's page. */
export function galleryCollectionPath(slug: string): string {
	return `${GALLERY_PATH}/${encodeURIComponent(slug)}`;
}
