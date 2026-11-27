import { Component, ElementRef, viewChild } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AccountMenu } from 'src/app/shared/ui/account-menu/account-menu';
import { ADMIN_PATH } from 'src/app/core/config/admin';
import { LOGO_PATH } from 'src/app/core/config/site';
import {
	NAVBAR_HEIGHT_VARIABLE,
	publishHeight
} from 'src/app/shared/utils/publish-height';

/**
 * The admin tools' app bar, in the public navbar's place: where you are, a
 * way back to the site, and the account menu.
 */
@Component({
	selector: 'app-admin-bar',
	templateUrl: './admin-bar.html',
	styleUrl: './admin-bar.scss',
	imports: [AccountMenu, MatIcon, RouterLink]
})
export class AdminBar {
	protected readonly logoPath = LOGO_PATH;
	protected readonly adminPath = ADMIN_PATH;
	private readonly bar = viewChild.required<ElementRef<HTMLElement>>('bar');

	constructor() {
		// In the navbar's place, so focus scrolls clear of it the same way.
		publishHeight(NAVBAR_HEIGHT_VARIABLE, () => this.bar().nativeElement);
	}
}
