import { Component, HostListener, Input } from '@angular/core';
import { ViewportScroller } from '@angular/common';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
    standalone: false
})
export class NavbarComponent {
    @Input('transparent') public isTransparent: boolean = true;

    public isHamburgerMenuVisible: boolean = false;

    constructor(private viewportScroller: ViewportScroller) {}

    public handlePageScroll(elemId: string): void {
        this.viewportScroller.scrollToAnchor(elemId);
    }

    public toggleHamburgerMenu(): void {
        this.isHamburgerMenuVisible = !this.isHamburgerMenuVisible;
    }

    @HostListener('window:resize', ['$event'])
    onResize(event: any) {
        const breakpoint: number =
            60 *
            parseFloat(getComputedStyle(document.documentElement).fontSize);
        const elem: any = event.target;

        // disabling the hamburger menu when the window size is greater than 60rem
        if (elem.innerWidth >= breakpoint) {
            this.isHamburgerMenuVisible = false;
        }
    }
}
