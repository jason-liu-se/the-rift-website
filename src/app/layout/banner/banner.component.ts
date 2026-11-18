import { DOCUMENT } from '@angular/common';
import {
	Component,
	DestroyRef,
	ElementRef,
	afterNextRender,
	inject
} from '@angular/core';
import { feedbackRole } from 'src/app/components/error-card/feedback-variant';
import { BannerService } from './banner.service';
import { OfflineBannerService } from './offline-banner.service';

/** CSS variable the navbar and page template offset themselves by. */
export const BANNER_HEIGHT_VARIABLE = '--banner-height';

/**
 * Shows BannerService's banners, fixed above the navbar. Publishes its height
 * as `--banner-height` on <html>, so the fixed navbar sits below it and the
 * page is pushed down instead of covered.
 */
@Component({
	selector: 'app-banner',
	templateUrl: './banner.component.html',
	styleUrl: './banner.component.scss'
})
export class BannerComponent {
	protected readonly bannerService = inject(BannerService);
	protected readonly feedbackRole = feedbackRole;

	constructor() {
		const host: HTMLElement = inject(ElementRef).nativeElement;
		const root = inject(DOCUMENT).documentElement;
		const offlineBanner = inject(OfflineBannerService);
		const destroyRef = inject(DestroyRef);

		afterNextRender(() => {
			offlineBanner.watch();
			const observer = new ResizeObserver(() =>
				root.style.setProperty(
					BANNER_HEIGHT_VARIABLE,
					`${host.offsetHeight}px`
				)
			);
			observer.observe(host);
			destroyRef.onDestroy(() => observer.disconnect());
		});
	}
}
