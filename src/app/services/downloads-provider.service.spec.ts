import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Constants } from '../config/constants';
import { IDownloadCollection } from '../interfaces/download-collection.interface';
import { DownloadsProviderService } from './downloads-provider.service';

describe('DownloadsProviderService', () => {
	const apiEndpoint = new Constants().API_ENDPOINT;
	let service: DownloadsProviderService;
	let httpTesting: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [provideHttpClient(), provideHttpClientTesting()]
		});
		service = TestBed.inject(DownloadsProviderService);
		httpTesting = TestBed.inject(HttpTestingController);
	});

	afterEach(() => httpTesting.verify());

	it('requests every download collection', () => {
		const collections: IDownloadCollection[] = [
			{ name: 'Resource packs', items: [] }
		];
		let result: IDownloadCollection[] | undefined;

		service.getDownloadCollections().subscribe((data) => (result = data));

		const request = httpTesting.expectOne(`${apiEndpoint}/downloads`);
		expect(request.request.method).toBe('GET');
		request.flush(collections);
		expect(result).toEqual(collections);
	});
});
