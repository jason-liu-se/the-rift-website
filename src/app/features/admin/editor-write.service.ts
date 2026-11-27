import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
	Observable,
	catchError,
	defaultIfEmpty,
	filter,
	map,
	of,
	switchMap
} from 'rxjs';
import { AdminNotifierService } from 'src/app/features/admin/admin-notifier.service';
import {
	ConfirmDialogData,
	confirmAction
} from './confirm-dialog/confirm-dialog.component';
import { describeWriteError } from './write-errors';

export interface EditorWrite {
	/** Asks first, for anything destructive. */
	confirm?: ConfirmDialogData;
	request: () => Observable<unknown>;
	/** The snackbar on success; none if omitted. */
	success?: string;
	/** The failure message, when `describeWriteError`'s isn't specific enough. */
	describeFailure?: (error: unknown) => string;
}

/**
 * The admin tools' one write flow: confirm (optional), send, and say how it
 * went. Emits once whether the write succeeded, or nothing if it was
 * cancelled; callers reload either way.
 */
@Injectable({ providedIn: 'root' })
export class EditorWriteService {
	private dialog = inject(MatDialog);
	private notifier = inject(AdminNotifierService);

	/** Asks before a destructive action; emits once whether it was confirmed. */
	public confirm(confirmation: ConfirmDialogData): Observable<boolean> {
		return confirmAction(this.dialog, confirmation);
	}

	public run({
		confirm,
		request,
		success,
		describeFailure = describeWriteError
	}: EditorWrite): Observable<boolean> {
		const confirmed = confirm ? this.confirm(confirm) : of(true);
		return confirmed.pipe(
			filter(Boolean),
			switchMap(() => request().pipe(defaultIfEmpty(undefined))),
			map(() => {
				if (success) {
					this.notifier.notifySuccess(success);
				}
				return true;
			}),
			catchError((error: unknown) => {
				this.notifier.notifyFailure(describeFailure(error));
				return of(false);
			})
		);
	}
}
