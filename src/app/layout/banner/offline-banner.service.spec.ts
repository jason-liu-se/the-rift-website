import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BannerService } from './banner.service';
import {
	BACK_ONLINE_MESSAGE,
	OFFLINE_MESSAGE,
	OfflineBannerService
} from './offline-banner.service';

describe('OfflineBannerService', () => {
	let banners: BannerService;

	beforeEach(() =>
		TestBed.configureTestingModule({ providers: [provideRouter([])] })
	);

	function watch(): void {
		TestBed.inject(OfflineBannerService).watch();
		banners = TestBed.inject(BannerService);
	}

	const shown = () =>
		banners.banners().map(({ variant, message }) => ({ variant, message }));

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

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

	it('says nothing about a working connection that was never lost', () => {
		watch();

		TestBed.inject(OfflineBannerService).reportOnline();

		expect(shown()).toEqual([]);
	});

	it('warns once however many requests fail', () => {
		watch();
		const show = vi.spyOn(banners, 'show');
		const connectivity = TestBed.inject(OfflineBannerService);

		connectivity.reportOffline();
		connectivity.reportOffline();

		expect(show).toHaveBeenCalledTimes(1);
	});

	it('reports offline when its own server is unreachable, then back online', async () => {
		watch();
		const connectivity = TestBed.inject(OfflineBannerService);
		vi.stubGlobal('fetch', () =>
			Promise.reject(new TypeError('Failed to fetch'))
		);

		expect(await connectivity.checkConnection()).toBe(false);
		expect(shown()).toEqual([
			{ variant: 'warning', message: OFFLINE_MESSAGE }
		]);

		vi.stubGlobal('fetch', () => Promise.resolve(new Response()));

		expect(await connectivity.checkConnection()).toBe(true);
		expect(shown()).toEqual([
			{ variant: 'success', message: BACK_ONLINE_MESSAGE }
		]);
	});
});
