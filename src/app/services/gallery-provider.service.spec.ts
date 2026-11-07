import { TestBed } from '@angular/core/testing';

import { GalleryProviderService } from './gallery-provider.service';

describe('GalleryProviderService', () => {
	let service: GalleryProviderService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(GalleryProviderService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
