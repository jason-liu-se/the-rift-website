import { Injectable, signal } from '@angular/core';
import { FeedbackVariant } from 'src/app/components/error-card/feedback-variant';

export interface IBanner {
	/** Showing a banner with the same id replaces it. */
	id: string;
	variant: FeedbackVariant;
	message: string;
}

/** The site-wide banners shown above the navbar on every page. */
@Injectable({ providedIn: 'root' })
export class BannerService {
	private readonly bannersSignal = signal<readonly IBanner[]>([]);

	public readonly banners = this.bannersSignal.asReadonly();

	public show(banner: IBanner): void {
		this.bannersSignal.update((banners) => [
			...banners.filter(({ id }) => id !== banner.id),
			banner
		]);
	}

	public dismiss(id: string): void {
		this.bannersSignal.update((banners) =>
			banners.filter((banner) => banner.id !== id)
		);
	}
}
