import { Component } from '@angular/core';
import { WelcomeCardComponent } from '../../components/welcome-card/welcome-card.component';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { SectionCardComponent } from '../../components/section-card/section-card.component';
import { isDesktopWidth } from 'src/app/utilities/viewport.util';

@Component({
	selector: 'app-page-home',
	templateUrl: './home-page.component.html',
	styleUrls: ['./home-page.component.scss'],
	imports: [
		WelcomeCardComponent,
		MatButton,
		RouterLink,
		SectionCardComponent
	],
	host: { '(window:resize)': 'updateWelcomeBackground()' }
})
export class HomePageComponent {
	// the welcome card has its own background only below the desktop breakpoint
	public showWelcomeComponentBackground = !isDesktopWidth();

	public updateWelcomeBackground(): void {
		this.showWelcomeComponentBackground = !isDesktopWidth();
	}
}
