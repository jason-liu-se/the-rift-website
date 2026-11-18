import { Component, ElementRef, afterNextRender, inject } from '@angular/core';
import { FocusRecoveryService } from '../page-template/focus-recovery.service';
import { publishHeight } from '../publish-height';
import { BannerService } from './banner.service';
import { OfflineBannerService } from './offline-banner.service';

/** CSS variable the navbar, page template and scroll padding offset by. */
export const BANNER_HEIGHT_VARIABLE = '--banner-height';

/**
 * Shows BannerService's banners, fixed above the navbar, once for the whole
 * app (outside the routed page template, so they aren't re-created and read
 * out again on every navigation). BannerService announces them, so the
 * banners themselves aren't live regions.
 */
@Component({
	selector: 'app-banner',
	templateUrl: './banner.component.html',
	styleUrl: './banner.component.scss'
})
export class BannerComponent {
	protected readonly bannerService = inject(BannerService);
	private readonly focusRecovery = inject(FocusRecoveryService);

	constructor() {
		const host: HTMLElement = inject(ElementRef).nativeElement;
		const offlineBanner = inject(OfflineBannerService);

		publishHeight(BANNER_HEIGHT_VARIABLE, () => host);
		afterNextRender(() => offlineBanner.watch());
	}

	protected dismiss(id: string): void {
		this.bannerService.dismiss(id);
		this.focusRecovery.recoverAfterRender();
	}
}
