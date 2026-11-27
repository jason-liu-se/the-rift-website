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
import { LOGO_PATH } from 'src/app/core/config/site';
import { AuthSession } from 'src/app/core/auth/auth-session';
import { isDesktopWidth } from 'src/app/shared/utils/viewport';
import {
	NAVBAR_HEIGHT_VARIABLE,
	publishHeight
} from 'src/app/shared/utils/publish-height';
import { UserMenu } from './user-menu/user-menu';

@Component({
	selector: 'app-navbar',
	templateUrl: './navbar.html',
	styleUrls: ['./navbar.scss'],
	imports: [MatIcon, RouterLink, RouterLinkActive, MatButton, UserMenu],
	host: {
		'(window:resize)': 'onResize()',
		'(document:keydown.escape)': 'closeHamburgerMenu()'
	}
})
export class Navbar {
	@Input() public transparent = true;

	public readonly logoPath = LOGO_PATH;
	public isHamburgerMenuVisible = false;

	/** The signed-in user; unknown (so no user menu) on the server and until checked. */
	private auth = inject(AuthSession);
	public readonly user = this.auth.user;

	private readonly menuButton =
		viewChild.required<ElementRef<HTMLButtonElement>>('menuButton');
	private readonly wrapper =
		viewChild.required<ElementRef<HTMLElement>>('wrapper');

	constructor() {
		// Visitors who never signed in make no request. `user()` stays unknown
		// (so no user menu) until the API answers, or fails and the saved user shows.
		afterNextRender(() => {
			if (this.auth.hasSavedUser()) {
				this.auth.checkSession().subscribe();
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
