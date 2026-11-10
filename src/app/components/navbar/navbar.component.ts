import { Component, Input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButton } from '@angular/material/button';

/** Width at which the hamburger menu gives way to the full menu (matches the stylesheet's 60rem query). */
export const MENU_BREAKPOINT_REM = 60;

@Component({
	selector: 'app-navbar',
	templateUrl: './navbar.component.html',
	styleUrls: ['./navbar.component.scss'],
	imports: [MatIcon, RouterLink, RouterLinkActive, MatButton],
	host: { '(window:resize)': 'onResize()' }
})
export class NavbarComponent {
	@Input() public transparent = true;

	public isHamburgerMenuVisible = false;

	public toggleHamburgerMenu(): void {
		this.isHamburgerMenuVisible = !this.isHamburgerMenuVisible;
	}

	public onResize(): void {
		const rootFontSize = parseFloat(
			getComputedStyle(document.documentElement).fontSize
		);

		if (window.innerWidth >= MENU_BREAKPOINT_REM * rootFontSize) {
			this.isHamburgerMenuVisible = false;
		}
	}
}
