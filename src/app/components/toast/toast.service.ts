import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Injectable, inject } from '@angular/core';
import { ToastComponent } from './toast.component';

/** How long a toast stays before it dismisses itself. */
export const TOAST_DURATION_MS = 6000;

/** Shows short notices ("You've logged out"). Browser only. */
@Injectable({
	providedIn: 'root'
})
export class ToastService {
	private overlay = inject(Overlay);
	private liveAnnouncer = inject(LiveAnnouncer);
	private current?: OverlayRef;
	private timer?: ReturnType<typeof setTimeout>;

	/** Shows `message` and announces it to screen readers; replaces any toast already showing. */
	public show(message: string): void {
		this.dismiss();
		const overlayRef = this.overlay.create({
			positionStrategy: this.overlay
				.position()
				.global()
				.centerHorizontally()
				.bottom('1.5rem')
		});
		overlayRef
			.attach(new ComponentPortal(ToastComponent))
			.setInput('message', message);
		this.current = overlayRef;
		this.timer = setTimeout(() => this.dismiss(), TOAST_DURATION_MS);
		void this.liveAnnouncer.announce(message, 'polite');
	}

	private dismiss(): void {
		clearTimeout(this.timer);
		this.current?.dispose();
		this.current = undefined;
	}
}
