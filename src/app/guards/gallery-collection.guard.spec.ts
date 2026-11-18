import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { environment } from 'src/environments/environment';
import { requireGalleryCollection } from './gallery-collection.guard';

describe('requireGalleryCollection', () => {
	const galleryUrl = `${environment.API_URL}/gallery`;
	let router: Router;
	let httpTesting: HttpTestingController;

	/** Navigates to `url` and answers GET /gallery; resolves to the URL reached. */
	async function visit(
		url: string,
		answer: (
			request: ReturnType<HttpTestingController['expectOne']>
		) => void
	): Promise<string> {
		const navigation = router.navigateByUrl(url);
		await Promise.resolve();
		answer(httpTesting.expectOne(galleryUrl));
		await navigation;
		return router.url;
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter([
					{
						path: 'gallery/:collection',
						canMatch: [requireGalleryCollection],
						children: [],
						data: { page: 'collection' }
					},
					{ path: '**', children: [], data: { page: 'not-found' } }
				])
			]
		});
		router = TestBed.inject(Router);
		httpTesting = TestBed.inject(HttpTestingController);
	});

	afterEach(() => httpTesting.verify());

	const matchedPage = () =>
		router.routerState.snapshot.root.firstChild?.data['page'];

	it('matches a collection the API lists', async () => {
		await visit('/gallery/season5', (request) =>
			request.flush(['season5', 'season6'])
		);

		expect(matchedPage()).toBe('collection');
	});

	it('falls through to the 404 route for any other collection', async () => {
		await visit('/gallery/season-5', (request) =>
			request.flush(['season5', 'season6'])
		);

		expect(matchedPage()).toBe('not-found');
	});

	it('matches when the API fails, so the page can show its error state', async () => {
		await visit('/gallery/season5', (request) =>
			request.flush(null, { status: 500, statusText: 'Server Error' })
		);

		expect(matchedPage()).toBe('collection');
	});
});
