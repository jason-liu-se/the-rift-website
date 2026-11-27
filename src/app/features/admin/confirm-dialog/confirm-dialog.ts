import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
	MAT_DIALOG_DATA,
	MatDialog,
	MatDialogActions,
	MatDialogClose,
	MatDialogContent,
	MatDialogTitle
} from '@angular/material/dialog';
import { Observable, map } from 'rxjs';

export interface ConfirmDialogData {
	title: string;
	message: string;
	/** The confirming button, e.g. "Delete 3 posts". */
	confirmLabel: string;
}

/** Asks before a destructive action; resolves to whether it was confirmed. */
@Component({
	selector: 'app-confirm-dialog',
	templateUrl: './confirm-dialog.html',
	imports: [
		MatButton,
		MatDialogActions,
		MatDialogClose,
		MatDialogContent,
		MatDialogTitle
	]
})
export class ConfirmDialog {
	protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}

/** Opens the dialog; emits once, true only if the user confirmed. */
export function confirmAction(
	dialog: MatDialog,
	data: ConfirmDialogData
): Observable<boolean> {
	return dialog
		.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
			data,
			role: 'alertdialog',
			autoFocus: 'dialog'
		})
		.afterClosed()
		.pipe(map((confirmed) => confirmed === true));
}
