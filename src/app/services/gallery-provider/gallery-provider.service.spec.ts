import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { GALLERY_COLLECTIONS, paginate } from 'src/app/testing/api-fixtures';
import { expectGet, flushServerError } from 'src/app/testing/http';
import { environment } from 'src/environments/environment';
import { GalleryProviderService } from './gallery-provider.service';

describe('GalleryProviderService', () => {
	const galleryUrl = `${environment.API_URL}/gallery`;
	const images = GALLERY_COLLECTIONS['season5'];
	// offset and limit differ, so swapping them changes the URL
	const pageUrl = `${galleryUrl}/season5?startIndex=1&limit=2`;
	let service: GalleryProviderService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [provideHttpClient(), provideHttpClientTesting()]
		});
		service = TestBed.inject(GalleryProviderService);
	});

	afterEach(() => TestBed.inject(HttpTestingController).verify());

	describe('collection names', () => {
		it('GETs every collection name and returns the response', () => {
			const names = Object.keys(GALLERY_COLLECTIONS);

			expect(
				expectGet(
					service.getCollectionNamesObservable(),
					galleryUrl,
					names
				)
			).toEqual(names);
		});

		it('passes server errors to the subscriber', () => {
			const error = flushServerError(
				service.getCollectionNamesObservable(),
				galleryUrl
			);

			expect(error?.status).toBe(500);
		});
	});

	describe('collection page', () => {
		it('GETs a page of a collection by offset and limit and returns the response', () => {
			const response = paginate(images, 1, 2);

			expect(
				expectGet(
					service.getCollectionImagesObservable('season5', 1, 2),
					pageUrl,
					response
				)
			).toEqual(response);
		});

		it('passes server errors to the subscriber', () => {
			const error = flushServerError(
				service.getCollectionImagesObservable('season5', 1, 2),
				pageUrl
			);

			expect(error?.status).toBe(500);
		});

		it('encodes the collection name as a single path segment', () => {
			const page = paginate(images, 0, 30);

			expect(
				expectGet(
					service.getCollectionImagesObservable('a/b c', 0, 30),
					`${galleryUrl}/a%2Fb%20c?startIndex=0&limit=30`,
					page
				)
			).toEqual(page);
		});
	});
});
