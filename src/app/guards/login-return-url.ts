/**
 * The `sessionStorage` key holding the page to return to after logging in
 * again. The API's login always lands on the admin page, so the app remembers
 * the rest (e.g. the tool and item, `/admin/news/<id>`) itself. `sessionStorage`
 * keeps it through the Discord round trip in the same tab.
 */
export const LOGIN_RETURN_URL_KEY = 'login-return-url';

/** Remembers `url` (a path on this site) for the next login in this tab. */
export function saveLoginReturnUrl(url: string): void {
	try {
		sessionStorage.setItem(LOGIN_RETURN_URL_KEY, url);
	} catch {
		// Storage is blocked: the login lands on the admin page instead.
	}
}

/** Takes the remembered page, if it's a path on this site (`/…`, not `//…`). */
export function takeLoginReturnUrl(): string | null {
	try {
		const url = sessionStorage.getItem(LOGIN_RETURN_URL_KEY);
		sessionStorage.removeItem(LOGIN_RETURN_URL_KEY);
		return url?.startsWith('/') && !url.startsWith('//') ? url : null;
	} catch {
		return null;
	}
}
