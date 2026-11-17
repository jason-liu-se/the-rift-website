import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { NEWS_POSTS, paginate } from 'src/app/testing/api-fixtures';
import { expectGet, flushServerError } from 'src/app/testing/http';
import { environment } from 'src/environments/environment';
import { NewsPostProviderService } from './news-post-provider.service';

describe('NewsPostProviderService', () => {
	// offset and limit differ, so swapping them changes the URL
	const pageUrl = `${environment.API_URL}/news?startIndex=10&limit=5`;
	let service: NewsPostProviderService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [provideHttpClient(), provideHttpClientTesting()]
		});
		service = TestBed.inject(NewsPostProviderService);
	});

	afterEach(() => TestBed.inject(HttpTestingController).verify());

	it('GETs a page of news by offset and limit and returns the response', () => {
		const response = paginate(NEWS_POSTS, 10, 5);

		expect(
			expectGet(service.getNewsPosts(10, 5), pageUrl, response)
		).toEqual(response);
	});

	it('passes server errors to the subscriber', () => {
		const error = flushServerError(service.getNewsPosts(10, 5), pageUrl);

		expect(error?.status).toBe(500);
	});
});
