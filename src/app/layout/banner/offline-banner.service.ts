import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { BannerService } from './banner.service';

export const CONNECTIVITY_BANNER_ID = 'connectivity';
export const OFFLINE_MESSAGE =
	"Can't connect. Some content won't load until your connection is back.";
export const BACK_ONLINE_MESSAGE = 'Back online.';

/**
 * Warns while the site can't reach the network, and says so when it can again.
 *
 * The browser's offline/online events alone miss most real outages: they only
 * fire when the device has no network adapter connected at all, not when the
 * connection is up but nothing gets through (weak Wi-Fi, a captive portal, a
 * VM adapter that stays connected in airplane mode). So requests that fail
 * without reaching a server also count, and the next one that succeeds clears
 * the warning.
 */
@Injectable({ providedIn: 'root' })
export class OfflineBannerService {
	private readonly banners = inject(BannerService);
	private readonly document = inject(DOCUMENT);
	private readonly window = this.document.defaultView;
	private readonly destroyRef = inject(DestroyRef);
	private isWatching = false;
	private isOffline = false;

	/** Starts listening; browser only (call from `afterNextRender`). Idempotent. */
	public watch(): void {
		if (this.isWatching || !this.window) {
			return;
		}
		this.isWatching = true;

		const window = this.window;
		const onOffline = () => this.reportOffline();
		const onOnline = () => this.reportOnline();
		window.addEventListener('offline', onOffline);
		window.addEventListener('online', onOnline);
		this.destroyRef.onDestroy(() => {
			window.removeEventListener('offline', onOffline);
			window.removeEventListener('online', onOnline);
		});
		if (!window.navigator.onLine) {
			this.reportOffline();
		}
	}

	/** A request failed without reaching any server. */
	public reportOffline(): void {
		if (this.isOffline) {
			return;
		}
		this.isOffline = true;
		this.banners.show({
			id: CONNECTIVITY_BANNER_ID,
			variant: 'warning',
			message: OFFLINE_MESSAGE
		});
	}

	/** A request got through; replaces the warning, if any. */
	public reportOnline(): void {
		if (!this.isOffline) {
			return;
		}
		this.isOffline = false;
		this.banners.show({
			id: CONNECTIVITY_BANNER_ID,
			variant: 'success',
			message: BACK_ONLINE_MESSAGE
		});
	}

	/**
	 * Asks this site's own server whether it's reachable, reporting the result.
	 * For failures that don't say why, like a page's code failing to download.
	 */
	public async checkConnection(): Promise<boolean> {
		try {
			await fetch(this.document.location.origin, {
				method: 'HEAD',
				cache: 'no-store'
			});
			this.reportOnline();
			return true;
		} catch {
			this.reportOffline();
			return false;
		}
	}
}
