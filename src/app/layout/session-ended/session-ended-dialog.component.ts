import { DIALOG_DATA, DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ADMIN_LOGIN_PATH } from 'src/app/config/admin';
import { saveLoginReturnUrl } from 'src/app/guards/login-return-url';
import {
	AuthService,
	SessionEndReason
} from 'src/app/services/auth/auth.service';

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
 * Opens the dialog. Nothing but its buttons closes it, not even Back (the page
 * behind no longer works), and the CDK's default scroll strategy stops the
 * page behind scrolling.
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
 * `SessionEndedService`; closes itself if they log back in in another tab.
 */
@Component({
	selector: 'app-session-ended-dialog',
	templateUrl: './session-ended-dialog.component.html',
	styleUrls: ['./session-ended-dialog.component.scss']
})
export class SessionEndedDialogComponent {
	private dialogRef = inject(DialogRef);
	private router = inject(Router);
	private user = inject(AuthService).user;

	public readonly copy = COPY[inject<SessionEndReason>(DIALOG_DATA)];

	constructor() {
		effect(() => {
			if (this.user()) {
				this.dialogRef.close();
			}
		});
	}

	public logInAgain(): void {
		saveLoginReturnUrl(this.router.url);
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
