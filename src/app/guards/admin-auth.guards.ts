import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { ADMIN_LOGIN_PATH, ADMIN_PATH } from '../config/admin';
import { AuthService } from '../services/auth/auth.service';

/** Lets in a logged-in editor; sends anyone else to the login page. */
export const requireLoggedIn: CanActivateFn = () => {
	const router = inject(Router);
	return inject(AuthService)
		.checkSession()
		.pipe(map((user) => (user ? true : router.parseUrl(ADMIN_LOGIN_PATH))));
};

/** Sends a logged-in editor straight to the admin page. */
export const requireLoggedOut: CanActivateFn = () => {
	const router = inject(Router);
	return inject(AuthService)
		.checkSession()
		.pipe(map((user) => (user ? router.parseUrl(ADMIN_PATH) : true)));
};
