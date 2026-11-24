import {
	DestroyRef,
	Injector,
	TemplateRef,
	afterNextRender,
	inject
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';

/**
 * Shows a routed component's template in a dialog over the list for as long
 * as its route is active: closing the dialog (Escape, the backdrop, or
 * `close()`) goes back to the list, keeping its filters, and leaving the
 * route (Back) closes the dialog. Call from a routed component's constructor;
 * it returns a function that closes the dialog.
 */
export function openModalRoute(
	content: () => TemplateRef<unknown>
): () => void {
	const dialog = inject(MatDialog);
	const router = inject(Router);
	const route = inject(ActivatedRoute);
	const injector = inject(Injector);
	const destroyRef = inject(DestroyRef);
	let dialogRef: MatDialogRef<unknown> | undefined;

	afterNextRender(() => {
		dialogRef = dialog.open(content(), {
			// Under the admin page, so the content gets its providers.
			injector,
			panelClass: 'admin-modal',
			maxWidth: '100vw',
			// The content focuses its own heading.
			autoFocus: false
		});
		dialogRef.afterClosed().subscribe(() => {
			if (!destroyRef.destroyed) {
				router.navigate(['.'], {
					relativeTo: route.parent,
					queryParamsHandling: 'preserve',
					// The list stays where it was scrolled.
					scroll: 'manual'
				});
			}
		});
	});
	destroyRef.onDestroy(() => dialogRef?.close());
	return () => dialogRef?.close();
}
