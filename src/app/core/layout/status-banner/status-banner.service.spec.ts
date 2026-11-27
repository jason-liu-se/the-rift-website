import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ApiStatusService } from '../../api/api-status/api-status.service';
import { StatusBannerService } from './status-banner.service';

@Component({ template: '' })
class EmptyPageComponent {}

describe('StatusBannerService', () => {
	let router: Router;
	let banner: StatusBannerService;

	beforeEach(async () => {
		TestBed.configureTestingModule({
			providers: [
				provideRouter([
					{
						path: '',
						component: EmptyPageComponent,
						// As in the app, the banner is created by the first page,
						// after the first navigation has started.
						canActivate: [
							() => {
								banner = inject(StatusBannerService);
								return true;
							}
						]
					},
					{ path: 'other', component: EmptyPageComponent }
				]),
				provideHttpClient(),
				provideHttpClientTesting()
			]
		});
		router = TestBed.inject(Router);
		await router.navigateByUrl('/');
		TestBed.tick();
	});

	it('hides "Back online" on the first navigation after the page load', async () => {
		window.dispatchEvent(new Event('offline'));
		TestBed.tick();
		window.dispatchEvent(new Event('online'));
		TestBed.tick();
		expect(banner.kind()).toBe('recovered');

		await router.navigateByUrl('/other');
		TestBed.tick();

		expect(banner.kind()).toBeNull();
	});

	it('still counts a navigation during an outage, so recovery says nothing', async () => {
		const apiStatus = TestBed.inject(ApiStatusService);
		apiStatus.reportDown();
		TestBed.tick();
		expect(banner.kind()).toBe('down');

		await router.navigateByUrl('/other');
		apiStatus.reportUp();
		TestBed.tick();

		expect(banner.kind()).toBeNull();
	});
});
