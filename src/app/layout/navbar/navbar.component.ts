import { Component, Input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { LOGO_PATH } from 'src/app/config/site';
import { isDesktopWidth } from 'src/app/utilities/viewport.util';

@Component({
	selector: 'app-navbar',
	templateUrl: './navbar.component.html',
	styleUrls: ['./navbar.component.scss'],
	imports: [MatIcon, RouterLink, RouterLinkActive, MatButton],
	host: { '(window:resize)': 'onResize()' }
})
export class NavbarComponent {
	@Input() public transparent = true;

	public readonly logoPath = LOGO_PATH;
	public isHamburgerMenuVisible = false;

	public toggleHamburgerMenu(): void {
		this.isHamburgerMenuVisible = !this.isHamburgerMenuVisible;
	}

	// the hamburger menu only exists below the desktop breakpoint
	public onResize(): void {
		if (isDesktopWidth()) {
			this.isHamburgerMenuVisible = false;
		}
	}
}
