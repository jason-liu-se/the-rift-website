import { Dialog } from '@angular/cdk/dialog';
import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ToastService } from 'src/app/components/toast/toast.service';
import { isOnProtectedPage } from 'src/app/guards/requires-login';
import {
	AuthService,
	SessionEndReason
} from 'src/app/services/auth/auth.service';

/**
 * Tells the user when their session ends without a logout in this tab: a
 * dialog on a protected page (it no longer works), a toast anywhere else. On a
 * fresh load of a protected page no page is open yet, so it's the toast, and
 * `requireLoggedIn` then redirects to the login page.
 */
@Injectable({
	providedIn: 'root'
})
export class SessionEndedService {
	private auth = inject(AuthService);
	private router = inject(Router);
	private toast = inject(ToastService);
	private dialog = inject(Dialog);
	private destroyRef = inject(DestroyRef);
	private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
	private dialogOpen = false;

	public start(): void {
		if (!this.isBrowser) {
			return;
		}
		this.auth.sessionEnded
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe((reason) => {
				if (isOnProtectedPage(this.router)) {
					this.openDialog(reason);
				} else {
					this.showToast();
				}
			});
	}

	/**
	 * One dialog at a time; its code loads on first use. If it can't be shown
	 * (a deploy replaced that code), the toast still tells the user.
	 */
	private openDialog(reason: SessionEndReason): void {
		if (this.dialogOpen) {
			return;
		}
		this.dialogOpen = true;
		import('./session-ended-dialog.component')
			.then(
				({
					SessionEndedDialogComponent,
					SESSION_ENDED_DIALOG_CONFIG
				}) =>
					this.dialog
						.open(SessionEndedDialogComponent, {
							...SESSION_ENDED_DIALOG_CONFIG,
							data: reason
						})
						.closed.subscribe(() => (this.dialogOpen = false))
			)
			.catch(() => {
				this.dialogOpen = false;
				this.showToast();
			});
	}

	private showToast(): void {
		this.toast.show('Your session has ended');
	}
}
