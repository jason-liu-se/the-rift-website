import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { ADMIN_LOGIN_PATH, ADMIN_PATH } from '../config/admin';
import { AuthSession } from './auth-session';
import { BrowserStorage } from '../browser-storage/browser-storage';
import { takeLoginReturnUrl } from './login-return-url';

/**
 * Lets in a logged-in editor, sending them on to the page they were on if they
 * just logged in again from the session-ended dialog; sends anyone else to the
 * login page.
 */
export const requireLoggedIn: CanActivateFn = (_route, state) => {
	const router = inject(Router);
	const storage = inject(BrowserStorage);
	return inject(AuthSession)
		.checkSession()
		.pipe(
			map((user) => {
				if (!user) {
					return router.parseUrl(ADMIN_LOGIN_PATH);
				}
				const returnUrl = takeLoginReturnUrl(storage);
				return returnUrl && returnUrl !== state.url
					? router.parseUrl(returnUrl)
					: true;
			})
		);
};

/** Sends a logged-in editor straight to the admin page. */
export const requireLoggedOut: CanActivateFn = () => {
	const router = inject(Router);
	return inject(AuthSession)
		.checkSession()
		.pipe(map((user) => (user ? router.parseUrl(ADMIN_PATH) : true)));
};
