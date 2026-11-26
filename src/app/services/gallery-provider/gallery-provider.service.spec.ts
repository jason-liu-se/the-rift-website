import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { GALLERY_COLLECTIONS, paginate } from 'src/app/testing/api-fixtures';
import { expectGet, flushServerError } from 'src/app/testing/http';
import { CONTENT_VERSION_MAX_AGE_MS } from 'src/app/config/api';
import { environment } from 'src/environments/environment';
import { GalleryProviderService } from './gallery-provider.service';

describe('GalleryProviderService', () => {
	const galleryUrl = `${environment.API_URL}/gallery`;
	const images = GALLERY_COLLECTIONS[0].images;
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

	describe('collections', () => {
		const collections = GALLERY_COLLECTIONS.map(({ slug, title }) => ({
			slug,
			title
		}));

		it('GETs every collection and returns the response', () => {
			expect(
				expectGet(service.fetchCollections(), galleryUrl, collections)
			).toEqual(collections);
		});

		it('shares one response between callers until the content version is too old', () => {
			vi.useFakeTimers({ toFake: ['Date'] });
			expectGet(service.fetchCollections(), galleryUrl, collections);

			let title: string | undefined;
			service
				.findCollectionTitle('season6')
				.subscribe((t) => (title = t));
			expect(title).toBe('Season 6');

			vi.advanceTimersByTime(CONTENT_VERSION_MAX_AGE_MS + 1);
			expectGet(service.fetchCollections(), galleryUrl, collections);
			vi.useRealTimers();
		});

		it('returns one collection by slug, or nothing when the API does not list it', () => {
			const collectionsBySlug: Record<string, unknown> = {};
			for (const slug of ['season5', 'season1']) {
				service
					.fetchCollection(slug)
					.subscribe(
						(collection) => (collectionsBySlug[slug] = collection)
					);
			}
			TestBed.inject(HttpTestingController)
				.expectOne(galleryUrl)
				.flush(collections);

			expect(collectionsBySlug).toEqual({
				season5: collections[0],
				season1: undefined
			});
		});

		it('finds no title for a collection the API does not list', () => {
			let title: string | undefined = 'unset';
			service
				.findCollectionTitle('season1')
				.subscribe((t) => (title = t));
			TestBed.inject(HttpTestingController)
				.expectOne(galleryUrl)
				.flush(collections);

			expect(title).toBeUndefined();
		});

		it('passes server errors to the subscriber, and asks again next time', () => {
			const error = flushServerError(
				service.fetchCollections(),
				galleryUrl
			);
			expect(error?.status).toBe(500);

			expectGet(service.fetchCollections(), galleryUrl, collections);
		});
	});

	describe('collection tags', () => {
		it("GETs a collection's tags", () => {
			expect(
				expectGet(
					service.fetchCollectionTags('season5'),
					`${galleryUrl}/season5/tags`,
					['night', 'spawn']
				)
			).toEqual(['night', 'spawn']);
		});
	});

	describe('collection page', () => {
		it('GETs a page of a collection by offset and limit and returns the response', () => {
			const response = paginate(images, 1, 2);

			expect(
				expectGet(
					service.fetchCollectionImages('season5', 1, 2),
					pageUrl,
					response
				)
			).toEqual(response);
		});

		it('passes server errors to the subscriber', () => {
			const error = flushServerError(
				service.fetchCollectionImages('season5', 1, 2),
				pageUrl
			);

			expect(error?.status).toBe(500);
		});

		it('sends tags normalised, unique, and sorted', () => {
			const page = paginate(images, 0, 30);

			expect(
				expectGet(
					service.fetchCollectionImages('season5', 0, 30, [
						'Spawn',
						'night',
						'spawn'
					]),
					`${galleryUrl}/season5?startIndex=0&limit=30&tags=night,spawn`,
					page
				)
			).toEqual(page);
		});

		it('encodes the collection name as a single path segment', () => {
			const page = paginate(images, 0, 30);

			expect(
				expectGet(
					service.fetchCollectionImages('a/b c', 0, 30),
					`${galleryUrl}/a%2Fb%20c?startIndex=0&limit=30`,
					page
				)
			).toEqual(page);
		});
	});
});
