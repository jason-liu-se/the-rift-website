import { Menu, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserAvatar } from 'src/app/shared/ui/user-avatar/user-avatar';
import { ADMIN_PATH } from 'src/app/core/config/site-paths';
import { UserLogout } from 'src/app/core/auth/user-logout';

/** The signed-in user's avatar, opening a menu of their account actions. */
@Component({
	selector: 'app-account-menu',
	templateUrl: './account-menu.html',
	styleUrl: './account-menu.scss',
	imports: [Menu, MenuItem, MenuTrigger, RouterLink, UserAvatar]
})
export class AccountMenu {
	protected readonly userLogout = inject(UserLogout);
	protected readonly adminPath = ADMIN_PATH;
	/** Turn off where the user is already in the admin tools. */
	public readonly showAdminLink = input(true);
}
