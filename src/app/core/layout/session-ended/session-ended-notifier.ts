import { Dialog } from '@angular/cdk/dialog';
import { Injectable, inject } from '@angular/core';
import { Toaster } from 'src/app/shared/ui/toast/toaster';
import { SessionEndReason } from 'src/app/core/auth/auth-session';
import {
	SESSION_ENDED_DIALOG_CONFIG,
	SessionEndedDialog
} from './session-ended-dialog';

/**
 * Shows that a session ended: the dialog on a protected page (it no longer
 * works), the toast anywhere else. Loaded by `SessionEndWatcher` on first
 * use, keeping the CDK overlay out of the initial bundle.
 */
@Injectable({
	providedIn: 'root'
})
export class SessionEndedNotifier {
	private toast = inject(Toaster);
	private dialog = inject(Dialog);
	private dialogOpen = false;

	public notify(reason: SessionEndReason, onProtectedPage: boolean): void {
		if (onProtectedPage) {
			this.openDialog(reason);
		} else {
			this.showToast();
		}
	}

	/** One dialog at a time; the toast if it can't be shown. */
	private openDialog(reason: SessionEndReason): void {
		if (this.dialogOpen) {
			return;
		}
		try {
			this.dialog
				.open(SessionEndedDialog, {
					...SESSION_ENDED_DIALOG_CONFIG,
					data: reason
				})
				.closed.subscribe(() => (this.dialogOpen = false));
			this.dialogOpen = true;
		} catch {
			this.showToast();
		}
	}

	private showToast(): void {
		this.toast.show('Your session has ended');
	}
}
