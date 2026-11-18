import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject, signal } from '@angular/core';

/**
 * Whether a page's API request failed, for showing `app-error-state` in place
 * of its content. Create it in an injection context (a field initializer).
 *
 * Failures are only shown in the browser. A failed or timed-out request
 * during server rendering leaves the page empty, as before, and the browser
 * requests the data again after hydration (`.claude/docs/rendering.md`);
 * server-rendering the error state instead would flash it and then mismatch
 * the browser's first render.
 */
export class LoadState {
	private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
	private readonly failedSignal = signal(false);
	private readonly retryingSignal = signal(false);

	public readonly failed = this.failedSignal.asReadonly();
	/** A retry is in flight; the error state stays up until it settles. */
	public readonly retrying = this.retryingSignal.asReadonly();

	/** Call as each request starts. */
	public start(): void {
		this.retryingSignal.set(this.failedSignal());
	}

	public succeed(): void {
		this.failedSignal.set(false);
		this.retryingSignal.set(false);
	}

	public fail(): void {
		this.failedSignal.set(this.isBrowser);
		this.retryingSignal.set(false);
	}
}
