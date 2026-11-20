import { Menu, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { Component, inject, output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from 'src/app/components/toast/toast.service';
import { UserAvatarComponent } from 'src/app/components/user-avatar/user-avatar.component';
import { ADMIN_LOGIN_PATH, ADMIN_PATH } from 'src/app/config/admin';
import { isOnProtectedPage } from 'src/app/guards/requires-login';
import { AuthService } from 'src/app/services/auth/auth.service';
import { FocusRecoveryService } from 'src/app/services/focus-recovery/focus-recovery.service';

/**
 * The signed-in user's account actions in the navbar: a menu opened from their
 * avatar on desktop, and plain items in the hamburger menu on mobile. Loaded
 * only once the user is known.
 */
@Component({
	selector: 'app-user-menu',
	templateUrl: './user-menu.component.html',
	styleUrls: ['./user-menu.component.scss'],
	imports: [Menu, MenuItem, MenuTrigger, RouterLink, UserAvatarComponent]
})
export class UserMenuComponent {
	private auth = inject(AuthService);
	private router = inject(Router);
	private toast = inject(ToastService);
	private focusRecovery = inject(FocusRecoveryService);

	public readonly adminPath = ADMIN_PATH;
	/** Emits once the session has ended, so the navbar can close the hamburger menu. */
	public readonly loggedOut = output();

	/**
	 * Logs out at once (the API is told in the background, see AuthService). A
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
