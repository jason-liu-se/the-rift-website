import { Menu, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { Component, inject, output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Toaster } from 'src/app/shared/ui/toast/toaster';
import { UserAvatar } from 'src/app/shared/ui/user-avatar/user-avatar';
import { ADMIN_LOGIN_PATH, ADMIN_PATH } from 'src/app/core/config/admin';
import { isOnProtectedPage } from 'src/app/core/auth/requires-login';
import { AuthSession } from 'src/app/core/auth/auth-session';
import { FocusRecovery } from 'src/app/core/focus-recovery/focus-recovery';

/**
 * The signed-in user's account actions in the navbar: a menu opened from their
 * avatar on desktop, and plain items in the hamburger menu on mobile. Loaded
 * only once the user is known.
 */
@Component({
	selector: 'app-user-menu',
	templateUrl: './user-menu.html',
	styleUrls: ['./user-menu.scss'],
	imports: [Menu, MenuItem, MenuTrigger, RouterLink, UserAvatar]
})
export class UserMenu {
	private auth = inject(AuthSession);
	private router = inject(Router);
	private toast = inject(Toaster);
	private focusRecovery = inject(FocusRecovery);

	public readonly adminPath = ADMIN_PATH;
	/** Emits once the session has ended, so the navbar can close the hamburger menu. */
	public readonly loggedOut = output();

	/**
	 * Logs out at once (the API is told in the background, see AuthSession). A
	 * protected page goes to the login page; a public one stays put and says so.
	 */
	public logout(): void {
		const leaveProtectedPage = isOnProtectedPage(this.router);
		this.auth.logout();
		this.loggedOut.emit();
		if (leaveProtectedPage) {
			void this.router.navigateByUrl(ADMIN_LOGIN_PATH);
		} else {
			// The menu goes with the user, taking focus with it.
			this.focusRecovery.recoverAfterRender();
			this.toast.show("You've logged out");
		}
	}
}
