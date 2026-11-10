import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CountResponse } from 'src/app/interfaces/api-responses';
import { GALLERY_COLLECTIONS, paginate } from 'src/app/testing/api-fixtures';
import { expectGet, flushServerError } from 'src/app/testing/http';
import { environment } from 'src/environments/environment';
import { GalleryProviderService } from './gallery-provider.service';

describe('GalleryProviderService', () => {
	const galleryUrl = `${environment.API_URL}/gallery`;
	const images = GALLERY_COLLECTIONS['season-5'];
	// offset and limit differ, so swapping them changes the URL
	const pageUrl = `${galleryUrl}/season-5?startIndex=1&limit=2`;
	const countUrl = `${galleryUrl}/season-5/count`;
	let service: GalleryProviderService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [provideHttpClient(), provideHttpClientTesting()]
		});
		service = TestBed.inject(GalleryProviderService);
	});

	afterEach(() => TestBed.inject(HttpTestingController).verify());

	describe('collection page', () => {
		it('GETs a page of a collection by offset and limit and returns the response', () => {
			const response = paginate(images, 1, 2);

			expect(
				expectGet(
					service.getCollectionImagesObservable('season-5', 1, 2),
					pageUrl,
					response
				)
			).toEqual(response);
		});

		it('passes server errors to the subscriber', () => {
			const error = flushServerError(
				service.getCollectionImagesObservable('season-5', 1, 2),
				pageUrl
			);

			expect(error?.status).toBe(500);
		});
	});

	describe('collection count', () => {
		it('GETs the image count of a collection and returns the response', () => {
			const response: CountResponse = { total: images.length };

			expect(
				expectGet(
					service.getCollectionImageCountObservable('season-5'),
					countUrl,
					response
				)
			).toEqual(response);
		});

		it('passes server errors to the subscriber', () => {
			const error = flushServerError(
				service.getCollectionImageCountObservable('season-5'),
				countUrl
			);

			expect(error?.status).toBe(500);
		});
	});

	it('encodes the collection name as a single path segment', () => {
		const encodedUrl = `${galleryUrl}/a%2Fb%20c`;
		const page = paginate(images, 0, 30);
		const count: CountResponse = { total: images.length };

		expect(
			expectGet(
				service.getCollectionImagesObservable('a/b c', 0, 30),
				`${encodedUrl}?startIndex=0&limit=30`,
				page
			)
		).toEqual(page);
		expect(
			expectGet(
				service.getCollectionImageCountObservable('a/b c'),
				`${encodedUrl}/count`,
				count
			)
		).toEqual(count);
	});
});
