import { TestBed } from '@angular/core/testing';

import { BannerService, IBanner } from './banner.service';

describe('BannerService', () => {
	const offline: IBanner = {
		id: 'connectivity',
		variant: 'warning',
		message: 'Offline'
	};
	const notice: IBanner = { id: 'notice', variant: 'error', message: 'Down' };
	let service: BannerService;

	beforeEach(() => {
		service = TestBed.inject(BannerService);
	});

	it('shows banners in the order they arrive', () => {
		service.show(offline);
		service.show(notice);

		expect(service.banners()).toEqual([offline, notice]);
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
});
