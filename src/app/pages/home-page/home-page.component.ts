import { Component, HostListener } from '@angular/core';

@Component({
    selector: 'app-page-home',
    templateUrl: './home-page.component.html',
    styleUrls: ['./home-page.component.scss'],
    standalone: false
})
export class HomePageComponent {
    public showWelcomeComponentBackground: boolean = false;

    @HostListener('window:resize', ['$event'])
    onResize(event: any) {
        const breakpoint: number =
            60 *
            parseFloat(getComputedStyle(document.documentElement).fontSize);
        const elem: any = event.target;

        // disabling the welcome component background when the window size is greater than 60rem
        if (elem.innerWidth >= breakpoint) {
            this.showWelcomeComponentBackground = false;
        } else {
            this.showWelcomeComponentBackground = true;
        }
    }
}
