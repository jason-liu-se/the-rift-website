import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
	SNACKBAR_SUCCESS_DURATION_MS,
	SNACKBAR_UNDO_DURATION_MS
} from '../../config/admin';

/**
 * Confirms the admin tools' actions in a snackbar, which MatSnackBar announces
 * to screen readers. A success dismisses itself; a failure stays until
 * dismissed, so it can be read in full. Admin pages only (Material).
 */
@Injectable({
	providedIn: 'root'
})
export class AdminNotifierService {
	private snackBar = inject(MatSnackBar);

	public notifySuccess(message: string): void {
		this.snackBar.open(message, 'OK', {
			duration: SNACKBAR_SUCCESS_DURATION_MS
		});
	}

	/** A success that can be taken back, for longer than a plain one. */
	public notifyWithUndo(message: string, undo: () => void): void {
		this.snackBar
			.open(message, 'Undo', { duration: SNACKBAR_UNDO_DURATION_MS })
			.onAction()
			.subscribe(undo);
	}

	public notifyFailure(message: string): void {
		this.snackBar.open(message, 'Dismiss', {
			politeness: 'assertive',
			panelClass: 'admin-snackbar-failure'
		});
	}

	/** A success or failure, as `hasFailures` says (e.g. a bulk summary). */
	public notify({
		message,
		hasFailures
	}: {
		message: string;
		hasFailures: boolean;
	}): void {
		if (hasFailures) {
			this.notifyFailure(message);
		} else {
			this.notifySuccess(message);
		}
	}
}
