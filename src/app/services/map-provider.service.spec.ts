import { TestBed } from '@angular/core/testing';

import { MapProviderService } from './map-provider.service';

describe('MapProviderService', () => {
	let service: MapProviderService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(MapProviderService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
