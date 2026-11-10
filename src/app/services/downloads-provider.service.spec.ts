import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { DOWNLOAD_COLLECTIONS } from 'src/app/testing/api-fixtures';
import { expectGet, flushServerError } from 'src/app/testing/http';
import { environment } from 'src/environments/environment';
import { DownloadsProviderService } from './downloads-provider.service';

describe('DownloadsProviderService', () => {
	const downloadsUrl = `${environment.API_URL}/downloads`;
	let service: DownloadsProviderService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [provideHttpClient(), provideHttpClientTesting()]
		});
		service = TestBed.inject(DownloadsProviderService);
	});

	afterEach(() => TestBed.inject(HttpTestingController).verify());

	it('GETs every download collection and returns the response', () => {
		expect(
			expectGet(
				service.getDownloadCollections(),
				downloadsUrl,
				DOWNLOAD_COLLECTIONS
			)
		).toEqual(DOWNLOAD_COLLECTIONS);
	});

	it('passes server errors to the subscriber', () => {
		const error = flushServerError(
			service.getDownloadCollections(),
			downloadsUrl
		);

		expect(error?.status).toBe(500);
	});
});
