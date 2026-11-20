import {
	Component,
	ElementRef,
	Input,
	afterNextRender,
	inject,
	viewChild
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { LOGO_PATH } from 'src/app/config/site';
import {
	AuthService,
	SAVED_USER_KEY
} from 'src/app/services/auth/auth.service';
import { isDesktopWidth } from 'src/app/utilities/viewport.util';
import { publishHeight } from '../publish-height';
import { UserMenuComponent } from './user-menu/user-menu.component';

/** CSS variable for `scroll-padding-top`, so focus isn't hidden under the navbar. */
export const NAVBAR_HEIGHT_VARIABLE = '--navbar-height';

@Component({
	selector: 'app-navbar',
	templateUrl: './navbar.component.html',
	styleUrls: ['./navbar.component.scss'],
	imports: [
		MatIcon,
		RouterLink,
		RouterLinkActive,
		MatButton,
		UserMenuComponent
	],
	host: {
		'(window:resize)': 'onResize()',
		'(document:keydown.escape)': 'closeHamburgerMenu()'
	}
})
export class NavbarComponent {
	@Input() public transparent = true;

	public readonly logoPath = LOGO_PATH;
	public isHamburgerMenuVisible = false;

	/** The signed-in user; unknown (so no user menu) on the server and until checked. */
	public readonly user = inject(AuthService).user;

	private readonly menuButton =
		viewChild.required<ElementRef<HTMLButtonElement>>('menuButton');
	private readonly wrapper =
		viewChild.required<ElementRef<HTMLElement>>('wrapper');

	constructor() {
		const auth = inject(AuthService);
		// Visitors who never signed in make no request. The saved user is what
		// shows (and lets the menu open) until the API confirms the session.
		afterNextRender(() => {
			if (hasSavedUser()) {
				auth.checkSession().subscribe();
			}
		});
		publishHeight(
			NAVBAR_HEIGHT_VARIABLE,
			() => this.wrapper().nativeElement
		);
	}

	public toggleHamburgerMenu(): void {
		this.isHamburgerMenuVisible = !this.isHamburgerMenuVisible;
	}

	/** Escape closes an open menu and returns focus to its button. */
	public closeHamburgerMenu(): void {
		if (!this.isHamburgerMenuVisible) {
			return;
		}
		this.isHamburgerMenuVisible = false;
		this.menuButton().nativeElement.focus();
	}

	// the hamburger menu only exists below the desktop breakpoint
	public onResize(): void {
		if (isDesktopWidth()) {
			this.isHamburgerMenuVisible = false;
		}
	}
}

function hasSavedUser(): boolean {
	try {
		return localStorage.getItem(SAVED_USER_KEY) !== null;
	} catch {
		return false;
	}
}
