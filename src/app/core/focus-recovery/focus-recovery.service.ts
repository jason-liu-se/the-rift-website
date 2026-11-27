import { DOCUMENT } from '@angular/common';
import {
	DestroyRef,
	EnvironmentInjector,
	Injectable,
	afterNextRender,
	inject
} from '@angular/core';

/**
 * Puts keyboard focus somewhere sensible when the element holding it is
 * removed (a retried error state, a paginator swapped for an error state),
 * instead of leaving it on <body>.
 */
@Injectable({ providedIn: 'root' })
export class FocusRecoveryService {
	private readonly document = inject(DOCUMENT);
	private readonly injector = inject(EnvironmentInjector);
	private lastFocused: Element | null = null;

	constructor() {
		// The server's document never receives focus events.
		const onFocusIn = (event: FocusEvent) =>
			(this.lastFocused = event.target as Element);
		this.document.addEventListener('focusin', onFocusIn);
		inject(DestroyRef).onDestroy(() =>
			this.document.removeEventListener('focusin', onFocusIn)
		);
	}

	/** Focus fell to <body> because the focused element was removed. */
	public wasFocusLost(): boolean {
		const active = this.document.activeElement;
		const onBody = !active || active === this.document.body;
		return onBody && !!this.lastFocused && !this.lastFocused.isConnected;
	}

	/** Focuses the page's <main> (it has `tabindex="-1"`). */
	public focusMain(): void {
		this.document
			.querySelector<HTMLElement>('main')
			?.focus({ preventScroll: true });
	}

	/** After the next render, focuses <main> if focus was lost. */
	public recoverAfterRender(): void {
		afterNextRender(
			() => {
				if (this.wasFocusLost()) {
					this.focusMain();
				}
			},
			{ injector: this.injector }
		);
	}
}
