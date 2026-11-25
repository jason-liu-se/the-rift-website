import {
	DestroyRef,
	Injector,
	TemplateRef,
	afterNextRender,
	inject
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, merge } from 'rxjs';

/**
 * Shows a routed component's template in a dialog over the list for as long
 * as its route is active. Closing it (Escape, the backdrop, or the returned
 * function) leaves the route for the list, keeping its filters and scroll;
 * leaving the route any way (Back, too) closes the dialog. So a route's
 * `canDeactivate` guards every way out. Call from a routed component's
 * constructor.
 */
export function openModalRoute(
	content: () => TemplateRef<unknown>
): () => void {
	const dialog = inject(MatDialog);
	const router = inject(Router);
	const route = inject(ActivatedRoute);
	const injector = inject(Injector);
	let dialogRef: MatDialogRef<unknown> | undefined;
	const leave = () =>
		void router.navigate(['.'], {
			relativeTo: route.parent,
			queryParamsHandling: 'preserve',
			// The list stays where it was scrolled.
			scroll: 'manual'
		});

	afterNextRender(() => {
		dialogRef = dialog.open(content(), {
			// Under the admin page, so the content gets its providers.
			injector,
			panelClass: 'admin-modal',
			maxWidth: '100vw',
			// The content focuses its own heading.
			autoFocus: false,
			// Closing goes through the route (and its guard), even on Back,
			// which would otherwise close it before the guard runs.
			disableClose: true,
			closeOnNavigation: false
		});
		merge(
			dialogRef.backdropClick(),
			dialogRef
				.keydownEvents()
				.pipe(filter(({ key }) => key === 'Escape'))
		).subscribe(leave);
	});
	inject(DestroyRef).onDestroy(() => dialogRef?.close());
	return leave;
}
