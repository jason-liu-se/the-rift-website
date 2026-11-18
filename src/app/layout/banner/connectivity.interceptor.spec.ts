import {
	HttpClient,
	provideHttpClient,
	withInterceptors
} from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BannerService } from './banner.service';
import { connectivityInterceptor } from './connectivity.interceptor';
import { BACK_ONLINE_MESSAGE, OFFLINE_MESSAGE } from './offline-banner.service';

describe('connectivityInterceptor', () => {
	let http: HttpClient;
	let backend: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				provideRouter([]),
				provideHttpClient(withInterceptors([connectivityInterceptor])),
				provideHttpClientTesting()
			]
		});
		http = TestBed.inject(HttpClient);
		backend = TestBed.inject(HttpTestingController);
	});

	const shownMessages = () =>
		TestBed.inject(BannerService)
			.banners()
			.map(({ message }) => message);

	function request(): void {
		http.get('/api').subscribe({ error: () => undefined });
	}

	it('warns when a request fails without reaching a server', () => {
		request();
		backend.expectOne('/api').error(new ProgressEvent('error'));

		expect(shownMessages()).toEqual([OFFLINE_MESSAGE]);
	});

	it('ignores errors the server answered with', () => {
		request();
		backend
			.expectOne('/api')
			.flush('', { status: 500, statusText: 'Server Error' });

		expect(shownMessages()).toEqual([]);
	});

	it('says the connection is back when a later request gets an answer', () => {
		request();
		backend.expectOne('/api').error(new ProgressEvent('error'));
		request();
		backend.expectOne('/api').flush({});

		expect(shownMessages()).toEqual([BACK_ONLINE_MESSAGE]);
	});
});
