import {
	BrowserStorage,
	STORAGE_KEYS
} from '../browser-storage/browser-storage.service';

// The API's login always lands on the admin page, so the app remembers the
// rest (e.g. the tool and item, `/admin/news/<id>`) itself.

/** Remembers `url` (a path on this site) for the next login in this tab. */
export function saveLoginReturnUrl(storage: BrowserStorage, url: string): void {
	// Without storage, the login lands on the admin page instead.
	storage.set('session', STORAGE_KEYS.loginReturnUrl, url);
}

/** Takes the remembered page, if it's a path on this site (`/…`, not `//…`). */
export function takeLoginReturnUrl(storage: BrowserStorage): string | null {
	const url = storage.get('session', STORAGE_KEYS.loginReturnUrl);
	storage.remove('session', STORAGE_KEYS.loginReturnUrl);
	return url?.startsWith('/') && !url.startsWith('//') ? url : null;
}
