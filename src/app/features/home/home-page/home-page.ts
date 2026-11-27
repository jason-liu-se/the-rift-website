import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, inject } from '@angular/core';
import { WelcomeCard } from './welcome-card/welcome-card';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { SectionCard } from '../../../shared/ui/section-card/section-card';
import { LOGO_PATH } from 'src/app/core/config/site';
import { isDesktopWidth } from 'src/app/shared/utils/viewport';
import { ABOUT_PATH, JOIN_PATH } from 'src/app/core/config/site-paths';

@Component({
	selector: 'app-page-home',
	templateUrl: './home-page.html',
	styleUrls: ['./home-page.scss'],
	imports: [WelcomeCard, MatButton, RouterLink, SectionCard],
	host: { '(window:resize)': 'updateWelcomeBackground()' }
})
export class HomePage {
	public readonly logoPath = LOGO_PATH;
	protected readonly joinPath = JOIN_PATH;
	protected readonly aboutPath = ABOUT_PATH;

	// The welcome card has its own background only below the desktop
	// breakpoint. Without a window (server rendering), assume mobile first.
	public showWelcomeComponentBackground =
		!isPlatformBrowser(inject(PLATFORM_ID)) || !isDesktopWidth();

	public updateWelcomeBackground(): void {
		this.showWelcomeComponentBackground = !isDesktopWidth();
	}
}
