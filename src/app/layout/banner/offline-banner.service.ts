import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { BannerService } from './banner.service';

export const CONNECTIVITY_BANNER_ID = 'connectivity';
export const OFFLINE_MESSAGE =
	"You're offline. Some pages won't load until you reconnect.";
export const BACK_ONLINE_MESSAGE = 'Back online.';

/** Warns while the browser is offline, and says so when it reconnects. */
@Injectable({ providedIn: 'root' })
export class OfflineBannerService {
	private readonly banners = inject(BannerService);
	private readonly window = inject(DOCUMENT).defaultView;
	private readonly destroyRef = inject(DestroyRef);
	private isWatching = false;

	/** Starts listening; browser only (call from `afterNextRender`). Idempotent. */
	public watch(): void {
		if (this.isWatching || !this.window) {
			return;
		}
		this.isWatching = true;

		const window = this.window;
		const onOffline = () => this.showOffline();
		const onOnline = () =>
			this.banners.show({
				id: CONNECTIVITY_BANNER_ID,
				variant: 'success',
				message: BACK_ONLINE_MESSAGE
			});
		window.addEventListener('offline', onOffline);
		window.addEventListener('online', onOnline);
		this.destroyRef.onDestroy(() => {
			window.removeEventListener('offline', onOffline);
			window.removeEventListener('online', onOnline);
		});
		if (!this.window.navigator.onLine) {
			this.showOffline();
		}
	}

	private showOffline(): void {
		this.banners.show({
			id: CONNECTIVITY_BANNER_ID,
			variant: 'warning',
			message: OFFLINE_MESSAGE
		});
	}
}
