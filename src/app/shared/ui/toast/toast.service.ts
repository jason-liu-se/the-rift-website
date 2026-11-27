import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { FocusRecoveryService } from 'src/app/core/focus-recovery/focus-recovery.service';
import { Toast } from './toast';

/** How long a toast stays before it dismisses itself. */
export const TOAST_DURATION_MS = 6000;

/** Shows short notices ("You've logged out"). Browser only. */
@Injectable({
	providedIn: 'root'
})
export class ToastService {
	private overlay = inject(Overlay);
	private liveAnnouncer = inject(LiveAnnouncer);
	private document = inject(DOCUMENT);
	private focusRecovery = inject(FocusRecoveryService);
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
		const toast = overlayRef.attach(new ComponentPortal(Toast));
		toast.setInput('message', message);
		toast.instance.dismissed.subscribe(() => this.dismiss());
		toast.instance.paused.subscribe(() => clearTimeout(this.timer));
		toast.instance.resumed.subscribe(() => {
			if (this.current === overlayRef) {
				this.startTimer();
			}
		});
		this.current = overlayRef;
		this.startTimer();
		void this.liveAnnouncer.announce(message, 'polite');
	}

	private startTimer(): void {
		clearTimeout(this.timer);
		this.timer = setTimeout(() => this.dismiss(), TOAST_DURATION_MS);
	}

	private dismiss(): void {
		clearTimeout(this.timer);
		// Don't let focus fall to <body> when it was on the toast.
		if (
			this.current?.overlayElement.contains(this.document.activeElement)
		) {
			this.focusRecovery.focusMain();
		}
		this.current?.dispose();
		this.current = undefined;
	}
}
