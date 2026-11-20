import { Page } from '@playwright/test';
import { environment } from '../../src/environments/environment.development';

// Must match SAVED_USER_KEY (auth.service.ts, which pulls in Angular).
export const SAVED_USER_KEY = 'session-user';
export const EDITOR = { id: '1', username: 'editor' };
const { API_URL } = environment;

/** Logs in with the mock API: the saved user makes the navbar check the session. */
export async function signIn(page: Page, logoutStatus = 204): Promise<void> {
	await page.addInitScript(
		([key, user]) => localStorage.setItem(key, user),
		[SAVED_USER_KEY, JSON.stringify(EDITOR)]
	);
	await page.route(`${API_URL}/auth/me**`, (route) =>
		route.fulfill({ status: 200, json: EDITOR })
	);
	await page.route(`${API_URL}/auth/logout`, (route) =>
		route.fulfill({ status: logoutStatus, body: '' })
	);
}
