import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { MAP_SEASONS } from 'src/app/testing/api-fixtures';
import { expectGet, flushServerError } from 'src/app/testing/http';
import { environment } from 'src/environments/environment';
import { MapProviderService } from './map-provider.service';

describe('MapProviderService', () => {
	const seasonsUrl = `${environment.API_URL}/maps/seasons`;
	let service: MapProviderService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [provideHttpClient(), provideHttpClientTesting()]
		});
		service = TestBed.inject(MapProviderService);
	});

	afterEach(() => TestBed.inject(HttpTestingController).verify());

	it('GETs every map season and returns the response', () => {
		expect(
			expectGet(service.getMapSeasons(), seasonsUrl, MAP_SEASONS)
		).toEqual(MAP_SEASONS);
	});

	it('passes server errors to the subscriber', () => {
		const error = flushServerError(service.getMapSeasons(), seasonsUrl);

		expect(error?.status).toBe(500);
	});
});
