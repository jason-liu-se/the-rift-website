import { TestBed } from '@angular/core/testing';

import { NewsItemProviderService } from './news-item-provider.service';

describe('NewsItemProviderService', () => {
	let service: NewsItemProviderService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(NewsItemProviderService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
