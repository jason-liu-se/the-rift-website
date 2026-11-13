import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { ADMIN_LOGIN_PATH, ADMIN_PATH } from '../config/admin';
import { AuthService } from '../services/auth.service';

/** Lets in a logged-in editor; sends anyone else to the login page. */
export const requireLoggedIn: CanActivateFn = () => {
	const router = inject(Router);
	return inject(AuthService)
		.getMe()
		.pipe(
			map(() => true),
			catchError(() => of(router.parseUrl(ADMIN_LOGIN_PATH)))
		);
};

/** Sends a logged-in editor straight to the admin page. */
export const requireLoggedOut: CanActivateFn = () => {
	const router = inject(Router);
	return inject(AuthService)
		.getMe()
		.pipe(
			map(() => router.parseUrl(ADMIN_PATH)),
			catchError(() => of(true))
		);
};
