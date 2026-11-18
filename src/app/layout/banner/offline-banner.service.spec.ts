import { TestBed } from '@angular/core/testing';

import { BannerService } from './banner.service';
import {
	BACK_ONLINE_MESSAGE,
	OFFLINE_MESSAGE,
	OfflineBannerService
} from './offline-banner.service';

describe('OfflineBannerService', () => {
	let banners: BannerService;

	function watch(): void {
		TestBed.inject(OfflineBannerService).watch();
		banners = TestBed.inject(BannerService);
	}

	const shown = () =>
		banners.banners().map(({ variant, message }) => ({ variant, message }));

	afterEach(() => vi.restoreAllMocks());

	it('shows nothing while online', () => {
		watch();

		expect(shown()).toEqual([]);
	});

	it('warns when the browser goes offline, then says when it is back', () => {
		watch();

		window.dispatchEvent(new Event('offline'));
		expect(shown()).toEqual([
			{ variant: 'warning', message: OFFLINE_MESSAGE }
		]);

		window.dispatchEvent(new Event('online'));
		expect(shown()).toEqual([
			{ variant: 'success', message: BACK_ONLINE_MESSAGE }
		]);
	});

	it('warns straight away when the page opens offline', () => {
		vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

		watch();

		expect(shown()).toEqual([
			{ variant: 'warning', message: OFFLINE_MESSAGE }
		]);
	});

	it('listens only once however often watch is called', () => {
		watch();
		watch();
		const show = vi.spyOn(banners, 'show');

		window.dispatchEvent(new Event('offline'));

		expect(show).toHaveBeenCalledTimes(1);
	});
});
