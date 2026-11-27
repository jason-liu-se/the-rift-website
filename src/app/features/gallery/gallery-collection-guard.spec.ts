import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { environment } from 'src/environments/environment';
import { GALLERY_COLLECTIONS } from 'src/app/testing/api-fixtures';
import {
	requireGalleryCollection,
	resolveFromGalleryTitle
} from './gallery-collection-guard';

const COLLECTIONS = GALLERY_COLLECTIONS.map(({ slug, title }) => ({
	slug,
	title
}));

describe('gallery collection routes', () => {
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
						resolve: {
							heading: resolveFromGalleryTitle(
								(title) => `Photos of ${title}`
							)
						},
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
	const resolvedHeading = () =>
		router.routerState.snapshot.root.firstChild?.data['heading'];

	it('matches a collection the API lists', async () => {
		await visit('/gallery/season5', (request) =>
			request.flush(COLLECTIONS)
		);

		expect(matchedPage()).toBe('collection');
	});

	it("resolves text from the collection's title, with one request", async () => {
		await visit('/gallery/season5', (request) =>
			request.flush(COLLECTIONS)
		);

		expect(resolvedHeading()).toBe('Photos of Season 5');
	});

	it('falls through to the 404 route for any other collection', async () => {
		await visit('/gallery/season-5', (request) =>
			request.flush(COLLECTIONS)
		);

		expect(matchedPage()).toBe('not-found');
	});

	it('matches when the API fails, so the page can show its error state', async () => {
		const serverError = { status: 500, statusText: 'Server Error' };
		const navigation = router.navigateByUrl('/gallery/season5');
		await Promise.resolve();
		httpTesting.expectOne(galleryUrl).flush(null, serverError);
		// A failure isn't kept, so the resolver asks again, then uses the slug.
		await new Promise((resolve) => setTimeout(resolve));
		httpTesting.expectOne(galleryUrl).flush(null, serverError);
		await navigation;

		expect(matchedPage()).toBe('collection');
		expect(resolvedHeading()).toBe('Photos of season5');
	});
});
