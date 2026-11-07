import { TestBed } from '@angular/core/testing';

import { DownloadsProviderService } from './downloads-provider.service';

describe('DownloadsProviderService', () => {
	let service: DownloadsProviderService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(DownloadsProviderService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
