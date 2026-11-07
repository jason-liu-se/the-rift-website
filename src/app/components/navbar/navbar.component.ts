import { Component, HostListener, Input, inject } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButton } from '@angular/material/button';

@Component({
	selector: 'app-navbar',
	templateUrl: './navbar.component.html',
	styleUrls: ['./navbar.component.scss'],
	imports: [MatIcon, RouterLink, RouterLinkActive, MatButton]
})
export class NavbarComponent {
	private viewportScroller = inject(ViewportScroller);

	@Input() public transparent = true;

	public isHamburgerMenuVisible = false;

	public handlePageScroll(elemId: string): void {
		this.viewportScroller.scrollToAnchor(elemId);
	}

	public toggleHamburgerMenu(): void {
		this.isHamburgerMenuVisible = !this.isHamburgerMenuVisible;
	}

	@HostListener('window:resize', ['$event'])
	onResize(event: UIEvent) {
		const breakpoint: number =
			60 *
			parseFloat(getComputedStyle(document.documentElement).fontSize);
		const elem = event.target as Window;

		// disabling the hamburger menu when the window size is greater than 60rem
		if (elem.innerWidth >= breakpoint) {
			this.isHamburgerMenuVisible = false;
		}
	}
}
