import { DIALOG_DATA, DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { Component, effect, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { ADMIN_LOGIN_PATH } from 'src/app/core/config/site-paths';
import { saveLoginReturnUrl } from 'src/app/core/auth/login-return-url';
import { BrowserStorage } from 'src/app/core/browser-storage/browser-storage';
import { isOnProtectedPage } from 'src/app/core/auth/requires-login';
import { AuthSession, SessionEndReason } from 'src/app/core/auth/auth-session';

const COPY: Record<SessionEndReason, { heading: string; text: string }> = {
	expired: {
		heading: 'Your session has ended',
		text: "For your security, you've been logged out. Log in again to keep editing."
	},
	'other-tab': {
		heading: "You've logged out",
		text: 'You logged out in another tab. Log in again to keep editing.'
	}
};

/**
 * Opens the dialog. Only its buttons, or leaving the protected page, close it:
 * not Escape, the backdrop, or Back to another admin tool (the page behind no
 * longer works). The CDK's default scroll strategy stops the page behind
 * scrolling.
 */
export const SESSION_ENDED_DIALOG_CONFIG = {
	role: 'alertdialog',
	disableClose: true,
	closeOnNavigation: false,
	ariaLabelledBy: 'session-ended-heading',
	ariaDescribedBy: 'session-ended-text',
	autoFocus: '.log-in-again'
} as const satisfies DialogConfig;

/**
 * Tells the user on a protected page that their session ended, and offers to
 * log in again (returning to this page) or go home. Opened by
 * `SessionEndedNotifier`; closes itself if they log back in in another tab, or
 * go back to a page that needs no login.
 */
@Component({
	selector: 'app-session-ended-dialog',
	templateUrl: './session-ended-dialog.html',
	styleUrls: ['./session-ended-dialog.scss']
})
export class SessionEndedDialog {
	private dialogRef = inject(DialogRef);
	private router = inject(Router);
	private storage = inject(BrowserStorage);
	private user = inject(AuthSession).user;

	public readonly copy = COPY[inject<SessionEndReason>(DIALOG_DATA)];

	constructor() {
		effect(() => {
			if (this.user()) {
				this.dialogRef.close();
			}
		});
		this.router.events
			.pipe(
				filter((event) => event instanceof NavigationEnd),
				takeUntilDestroyed()
			)
			.subscribe(() => {
				if (!isOnProtectedPage(this.router)) {
					this.dialogRef.close();
				}
			});
	}

	public logInAgain(): void {
		saveLoginReturnUrl(this.storage, this.router.url);
		this.leaveFor(ADMIN_LOGIN_PATH);
	}

	public goHome(): void {
		this.leaveFor('/');
	}

	private leaveFor(url: string): void {
		this.dialogRef.close();
		void this.router.navigateByUrl(url);
	}
}
