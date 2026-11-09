import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Constants } from '../config/constants';
import { INewsItem } from '../interfaces/news-item.interface';
import { IPaginatedResponse } from '../interfaces/paginated-response.interface';
import { NewsItemProviderService } from './news-item-provider.service';

describe('NewsItemProviderService', () => {
	const apiEndpoint = new Constants().API_ENDPOINT;
	let service: NewsItemProviderService;
	let httpTesting: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [provideHttpClient(), provideHttpClientTesting()]
		});
		service = TestBed.inject(NewsItemProviderService);
		httpTesting = TestBed.inject(HttpTestingController);
	});

	afterEach(() => httpTesting.verify());

	it('requests a page of news items with its total', () => {
		const page: IPaginatedResponse<INewsItem> = {
			items: [{ title: 'Launch', date: '2026-01-01', content: 'Hi' }],
			total: 11
		};
		let result: IPaginatedResponse<INewsItem> | undefined;

		service.getNewsItems(20, 10).subscribe((data) => (result = data));

		const request = httpTesting.expectOne(
			`${apiEndpoint}/news?startIndex=20&limit=10`
		);
		expect(request.request.method).toBe('GET');
		request.flush(page);
		expect(result).toEqual(page);
	});
});
