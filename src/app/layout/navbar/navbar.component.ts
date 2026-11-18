import { Component, ElementRef, Input, viewChild } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { LOGO_PATH } from 'src/app/config/site';
import { isDesktopWidth } from 'src/app/utilities/viewport.util';
import { publishHeight } from '../publish-height';

/** CSS variable for `scroll-padding-top`, so focus isn't hidden under the navbar. */
export const NAVBAR_HEIGHT_VARIABLE = '--navbar-height';

@Component({
	selector: 'app-navbar',
	templateUrl: './navbar.component.html',
	styleUrls: ['./navbar.component.scss'],
	imports: [MatIcon, RouterLink, RouterLinkActive, MatButton],
	host: {
		'(window:resize)': 'onResize()',
		'(document:keydown.escape)': 'closeHamburgerMenu()'
	}
})
export class NavbarComponent {
	@Input() public transparent = true;

	public readonly logoPath = LOGO_PATH;
	public isHamburgerMenuVisible = false;

	private readonly menuButton =
		viewChild.required<ElementRef<HTMLButtonElement>>('menuButton');
	private readonly wrapper =
		viewChild.required<ElementRef<HTMLElement>>('wrapper');

	constructor() {
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
