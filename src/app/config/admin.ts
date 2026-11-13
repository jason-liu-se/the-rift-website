/** The admin pages' URLs; must match their paths in app.routes.ts. */
export const ADMIN_PATH = '/admin';
export const ADMIN_LOGIN_PATH = '/admin/login';

/** Keeps the admin pages out of search results, even for crawlers that don't run JavaScript. */
export const NOINDEX_HEADERS = { 'X-Robots-Tag': 'noindex' };
