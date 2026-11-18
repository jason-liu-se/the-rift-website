import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { ANY_URL_ROUTES } from 'src/app/testing/render-component';
import { BannerService, IBanner } from './banner.service';

describe('BannerService', () => {
	const offline: IBanner = {
		id: 'connectivity',
		variant: 'warning',
		message: 'Offline'
	};
	const notice: IBanner = { id: 'notice', variant: 'error', message: 'Down' };
	const saved: IBanner = {
		id: 'saved',
		variant: 'success',
		message: 'Saved'
	};
	const announce = vi.fn(() => Promise.resolve());
	let service: BannerService;

	beforeEach(() => {
		announce.mockClear();
		TestBed.configureTestingModule({
			providers: [
				provideRouter(ANY_URL_ROUTES),
				{ provide: LiveAnnouncer, useValue: { announce } }
			]
		});
		service = TestBed.inject(BannerService);
	});

	it('shows banners in the order they arrive', () => {
		service.show(offline);
		service.show(notice);

		expect(service.banners()).toEqual([offline, notice]);
	});

	it('announces errors and warnings assertively and success politely', () => {
		service.show(notice);
		service.show(offline);
		service.show(saved);

		expect(announce.mock.calls).toEqual([
			['Down', 'assertive'],
			['Offline', 'assertive'],
			['Saved', 'polite']
		]);
	});

	it('replaces a banner shown again with the same id', () => {
		const backOnline: IBanner = {
			id: 'connectivity',
			variant: 'success',
			message: 'Back online'
		};
		service.show(offline);
		service.show(notice);

		service.show(backOnline);

		expect(service.banners()).toEqual([notice, backOnline]);
	});

	it('dismisses a banner by id', () => {
		service.show(offline);
		service.show(notice);

		service.dismiss('connectivity');

		expect(service.banners()).toEqual([notice]);
	});

	it('clears success banners on the next navigation, keeping the rest', async () => {
		service.show(offline);
		service.show(saved);

		await TestBed.inject(Router).navigateByUrl('/news');

		expect(service.banners()).toEqual([offline]);
	});
});
