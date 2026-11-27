import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Toaster } from 'src/app/shared/ui/toast/toaster';
import { FocusRecovery } from 'src/app/core/focus-recovery/focus-recovery';
import { ADMIN_LOGIN_PATH } from 'src/app/core/config/site-paths';
import { AuthSession } from './auth-session';
import { isOnProtectedPage } from './requires-login';

/** What a Log out button does, wherever it is. */
@Injectable({ providedIn: 'root' })
export class UserLogout {
	private auth = inject(AuthSession);
	private router = inject(Router);
	private toast = inject(Toaster);
	private focusRecovery = inject(FocusRecovery);

	/**
	 * Logs out at once (the API is told in the background, see AuthSession). A
	 * protected page goes to the login page; a public one stays put and says so.
	 */
	public logout(): void {
		const leaveProtectedPage = isOnProtectedPage(this.router);
		this.auth.logout();
		if (leaveProtectedPage) {
			void this.router.navigateByUrl(ADMIN_LOGIN_PATH);
		} else {
			// The menu goes with the user, taking focus with it.
			this.focusRecovery.recoverAfterRender();
			this.toast.show("You've logged out");
		}
	}
}
