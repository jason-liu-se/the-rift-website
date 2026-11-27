import { Component, inject, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AccountMenu } from 'src/app/shared/ui/account-menu/account-menu';
import { UserAvatar } from 'src/app/shared/ui/user-avatar/user-avatar';
import { ADMIN_PATH } from 'src/app/core/config/site-paths';
import { UserLogout } from 'src/app/core/auth/user-logout';

/**
 * The signed-in user's account actions in the navbar: the account menu on
 * desktop, and plain items in the hamburger menu on mobile. Loaded only once
 * the user is known.
 */
@Component({
	selector: 'app-user-menu',
	templateUrl: './user-menu.html',
	styleUrls: ['./user-menu.scss'],
	imports: [AccountMenu, RouterLink, UserAvatar]
})
export class UserMenu {
	private userLogout = inject(UserLogout);

	public readonly adminPath = ADMIN_PATH;
	/** Emits on a logout from the hamburger menu, so the navbar can close it. */
	public readonly loggedOut = output();

	public logout(): void {
		this.userLogout.logout();
		this.loggedOut.emit();
	}
}
