import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { UserAvatarComponent } from 'src/app/components/user-avatar/user-avatar.component';
import { ADMIN_LOGIN_PATH, ADMIN_PATH } from 'src/app/config/admin';
import { LOGO_PATH } from 'src/app/config/site';
import { NAVBAR_HEIGHT_VARIABLE } from 'src/app/layout/navbar/navbar.component';
import { publishHeight } from 'src/app/layout/publish-height';
import { AuthService } from 'src/app/services/auth/auth.service';

/**
 * The admin tools' app bar, in the public navbar's place: where you are, a
 * way back to the site, and the account menu.
 */
@Component({
	selector: 'app-admin-bar',
	templateUrl: './admin-bar.component.html',
	styleUrl: './admin-bar.component.scss',
	imports: [
		MatIcon,
		MatIconButton,
		MatMenu,
		MatMenuItem,
		MatMenuTrigger,
		MatTooltip,
		RouterLink,
		UserAvatarComponent
	]
})
export class AdminBarComponent {
	private auth = inject(AuthService);
	private router = inject(Router);

	protected readonly logoPath = LOGO_PATH;
	protected readonly adminPath = ADMIN_PATH;
	protected readonly user = this.auth.user;
	private readonly bar = viewChild.required<ElementRef<HTMLElement>>('bar');

	constructor() {
		// In the navbar's place, so focus scrolls clear of it the same way.
		publishHeight(NAVBAR_HEIGHT_VARIABLE, () => this.bar().nativeElement);
	}

	/** Logs out at once (see AuthService) and leaves the protected pages. */
	protected logout(): void {
		this.auth.logout();
		void this.router.navigateByUrl(ADMIN_LOGIN_PATH);
	}
}
