import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Injectable, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { FeedbackVariant } from 'src/app/components/error-card/feedback-variant';

export interface IBanner {
	/** Showing a banner with the same id replaces it. */
	id: string;
	variant: FeedbackVariant;
	message: string;
}

/**
 * The site-wide banners shown above the navbar on every page. Success
 * banners clear on the next navigation; others stay until dismissed.
 */
@Injectable({ providedIn: 'root' })
export class BannerService {
	private readonly announcer = inject(LiveAnnouncer);
	private readonly bannersSignal = signal<readonly IBanner[]>([]);

	public readonly banners = this.bannersSignal.asReadonly();

	constructor() {
		inject(Router)
			.events.pipe(filter((event) => event instanceof NavigationEnd))
			.subscribe(() =>
				this.bannersSignal.update((banners) =>
					banners.filter(({ variant }) => variant !== 'success')
				)
			);
	}

	/** Shows a banner and reads its message out (errors and warnings interrupt). */
	public show(banner: IBanner): void {
		this.bannersSignal.update((banners) => [
			...banners.filter(({ id }) => id !== banner.id),
			banner
		]);
		void this.announcer.announce(
			banner.message,
			banner.variant === 'success' ? 'polite' : 'assertive'
		);
	}

	public dismiss(id: string): void {
		this.bannersSignal.update((banners) =>
			banners.filter((banner) => banner.id !== id)
		);
	}
}
