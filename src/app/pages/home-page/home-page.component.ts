import { Component, HostListener } from '@angular/core';
import { WelcomeCardComponent } from '../../components/welcome-card/welcome-card.component';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { SectionCardComponent } from '../../components/section-card/section-card.component';

@Component({
	selector: 'app-page-home',
	templateUrl: './home-page.component.html',
	styleUrls: ['./home-page.component.scss'],
	imports: [WelcomeCardComponent, MatButton, RouterLink, SectionCardComponent]
})
export class HomePageComponent {
	public showWelcomeComponentBackground = false;

	@HostListener('window:resize', ['$event'])
	onResize(event: UIEvent) {
		const breakpoint: number =
			60 *
			parseFloat(getComputedStyle(document.documentElement).fontSize);
		const elem = event.target as Window;

		// disabling the welcome component background when the window size is greater than 60rem
		if (elem.innerWidth >= breakpoint) {
			this.showWelcomeComponentBackground = false;
		} else {
			this.showWelcomeComponentBackground = true;
		}
	}
}
