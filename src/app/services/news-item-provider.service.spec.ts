import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { NEWS_ITEMS, paginate } from 'src/app/testing/api-fixtures';
import { expectGet, flushServerError } from 'src/app/testing/http';
import { environment } from 'src/environments/environment';
import { NewsItemProviderService } from './news-item-provider.service';

describe('NewsItemProviderService', () => {
	// offset and limit differ, so swapping them changes the URL
	const pageUrl = `${environment.API_URL}/news?startIndex=10&limit=5`;
	let service: NewsItemProviderService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [provideHttpClient(), provideHttpClientTesting()]
		});
		service = TestBed.inject(NewsItemProviderService);
	});

	afterEach(() => TestBed.inject(HttpTestingController).verify());

	it('GETs a page of news by offset and limit and returns the response', () => {
		const response = paginate(NEWS_ITEMS, 10, 5);

		expect(
			expectGet(service.getNewsItems(10, 5), pageUrl, response)
		).toEqual(response);
	});

	it('passes server errors to the subscriber', () => {
		const error = flushServerError(service.getNewsItems(10, 5), pageUrl);

		expect(error?.status).toBe(500);
	});
});
