import { Signal, computed, signal } from '@angular/core';

/**
 * An image's URL until it fails to load, so a placeholder shows instead. A new
 * URL (an avatar changed) is tried again.
 */
export function untilLoadFails(url: () => string | undefined): {
	url: Signal<string | undefined>;
	markFailed: (failedUrl: string) => void;
} {
	const failedUrl = signal<string | undefined>(undefined);
	return {
		url: computed(() => {
			const current = url();
			return current !== failedUrl() ? current : undefined;
		}),
		markFailed: (failed) => failedUrl.set(failed)
	};
}
