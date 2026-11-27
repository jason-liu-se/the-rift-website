import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
	ActivatedRoute,
	Params,
	convertToParamMap,
	provideRouter,
	Router
} from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { GALLERY_FALLBACK_IMAGE } from 'src/app/core/config/gallery';
import {
	GalleryCollection,
	GalleryImage
} from 'src/app/core/api/api-responses';
import { GALLERY_COLLECTIONS } from 'src/app/testing/api-fixtures';
import { ANY_URL_ROUTES } from 'src/app/testing/render-component';
import { environment } from 'src/environments/environment';
import { GalleryShowcasePageComponent } from './gallery-showcase-page.component';

const PAGE_SIZE = 30;
const TOTAL = 31;
const FIRST_PAGE: GalleryImage[] = [
	{ id: '1', imageUrl: 'one.png', caption: 'One', tags: ['spawn'] },
	{ id: '2', imageUrl: 'two.png', caption: 'Two', tags: [] }
];
const SECOND_PAGE: GalleryImage[] = [
	{ id: '3', imageUrl: 'three.png', caption: 'Three', tags: [] }
];
// Season 5 has dimensions; season 6 has none.
const COLLECTIONS: GalleryCollection[] = GALLERY_COLLECTIONS.map(
	({ slug, title, dimensions }) => ({ slug, title, dimensions })
);
const SEASON_5_HEADER_IMAGE = COLLECTIONS[0].dimensions![0].imageUrl;

describe('GalleryShowcasePageComponent', () => {
	let fixture: ComponentFixture<GalleryShowcasePageComponent>;
	let element: HTMLElement;
	let httpTesting: HttpTestingController;
	let routeParams: Record<string, string>;

	const pageUrl = (collection: string, startIndex: number, tags = '') =>
		`${environment.API_URL}/gallery/${collection}?startIndex=${startIndex}&limit=${PAGE_SIZE}${tags && `&tags=${tags}`}`;
	const tagsUrl = (collection: string) =>
		`${environment.API_URL}/gallery/${collection}/tags`;
	const tagButton = (name: string) =>
		[
			...element.querySelectorAll<HTMLButtonElement>(
				'app-tag-filter button'
			)
		].find((button) => button.textContent?.trim() === name)!;
	const captions = () =>
		[...element.querySelectorAll('.image-button .caption-text')].map(
			(caption) => caption.textContent
		);
	const rangeLabels = () =>
		[...element.querySelectorAll('.mat-mdc-paginator-range-label')].map(
			(label) => label.textContent?.trim()
		);
	const clickPaginator = (label: string) => {
		element
			.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!
			.click();
		fixture.detectChanges();
	};

	const headerImage = () =>
		element
			.querySelector('.background-image-card img')
			?.getAttribute('src');

	/** Opens the page, answering its collections and tags requests. */
	function render(collection: string, tags = ['night', 'spawn']): void {
		routeParams['collection'] = collection;
		fixture = TestBed.createComponent(GalleryShowcasePageComponent);
		element = fixture.nativeElement;
		fixture.detectChanges();
		httpTesting
			.expectOne(`${environment.API_URL}/gallery`)
			.flush(COLLECTIONS);
		httpTesting.expectOne(tagsUrl(collection)).flush(tags);
	}

	/** The URL's query; navigating with `queryParams` changes it here. */
	let queryParams: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

	beforeEach(() => {
		routeParams = {};
		queryParams = new BehaviorSubject(convertToParamMap({}));
		TestBed.configureTestingModule({
			imports: [GalleryShowcasePageComponent],
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter(ANY_URL_ROUTES),
				{
					provide: ActivatedRoute,
					useFactory: () => ({
						snapshot: {
							params: routeParams,
							data: { collectionTitle: 'Season 5' }
						},
						queryParamMap: queryParams
					})
				}
			]
		});
		httpTesting = TestBed.inject(HttpTestingController);
		const router = TestBed.inject(Router);
		const navigate = router.navigate.bind(router);
		vi.spyOn(router, 'navigate').mockImplementation((commands, extras) => {
			if (!extras?.queryParams) {
				return navigate(commands, extras);
			}
			const query = Object.entries(extras.queryParams as Params).filter(
				([, value]) => value !== null
			);
			queryParams.next(convertToParamMap(Object.fromEntries(query)));
			return Promise.resolve(true);
		});
	});

	afterEach(() => httpTesting.verify());

	it('opens filtered by the tags in the URL, so a filtered view can be shared', () => {
		queryParams.next(convertToParamMap({ tags: 'spawn' }));
		render('season5');
		httpTesting
			.expectOne(pageUrl('season5', 0, 'spawn'))
			.flush({ items: [FIRST_PAGE[0]], total: 1 });
		fixture.detectChanges();

		expect(captions()).toEqual(['One']);
		expect(tagButton('spawn').getAttribute('aria-pressed')).toBe('true');
	});

	describe('with a collection in the URL', () => {
		beforeEach(() => {
			render('season5');
			httpTesting
				.expectOne(pageUrl('season5', 0))
				.flush({ items: FIRST_PAGE, total: TOTAL });
			fixture.detectChanges();
		});

		it("shows the collection's name and first dimension's image as the page header", () => {
			expect(element.querySelector('h1')?.textContent).toBe(
				'Gallery: Season 5'
			);
			expect(headerImage()).toBe(SEASON_5_HEADER_IMAGE);
		});

		it('shows the first page of the collection and its total', () => {
			expect(captions()).toEqual(['One', 'Two']);
			expect(
				element.querySelector('.page-caption')?.textContent?.trim()
			).toBe(`Results: ${TOTAL}`);
			expect(rangeLabels()).toEqual(['Page 1 of 2', 'Page 1 of 2']);
		});

		it('loads the next page when Next is clicked, keeping both paginators in sync', () => {
			vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

			clickPaginator('Next page');
			httpTesting
				.expectOne(pageUrl('season5', PAGE_SIZE))
				.flush({ items: SECOND_PAGE, total: TOTAL });
			fixture.detectChanges();

			expect(captions()).toEqual(['Three']);
			expect(rangeLabels()).toEqual(['Page 2 of 2', 'Page 2 of 2']);
			expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
		});

		it('shows a visited page again from cache without a new request', () => {
			vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
			clickPaginator('Next page');
			httpTesting
				.expectOne(pageUrl('season5', PAGE_SIZE))
				.flush({ items: SECOND_PAGE, total: TOTAL });
			fixture.detectChanges();

			clickPaginator('Previous page');

			// afterEach's verify() fails if this made another request.
			expect(captions()).toEqual(['One', 'Two']);
		});

		it('ignores a late response for a page the user has already left', () => {
			vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
			clickPaginator('Next page');
			clickPaginator('Previous page');

			httpTesting
				.expectOne(pageUrl('season5', PAGE_SIZE))
				.flush({ items: SECOND_PAGE, total: TOTAL });
			fixture.detectChanges();
			expect(captions()).toEqual(['One', 'Two']);

			// the late response is still cached for when the user returns
			clickPaginator('Next page');
			expect(captions()).toEqual(['Three']);
		});

		it('shows only the latest request after leaving a page and coming back', () => {
			vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
			clickPaginator('Next page');
			clickPaginator('Previous page');
			clickPaginator('Next page');
			const [stale, latest] = httpTesting.match(
				pageUrl('season5', PAGE_SIZE)
			);

			stale.flush(null, { status: 500, statusText: 'Server Error' });
			fixture.detectChanges();
			expect(element.querySelector('app-fallback-panel')).toBeNull();

			latest.flush({ items: SECOND_PAGE, total: TOTAL });
			fixture.detectChanges();
			expect(captions()).toEqual(['Three']);
		});

		it('shows only photos with every selected tag, from the first page', () => {
			vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
			clickPaginator('Next page');
			httpTesting
				.expectOne(pageUrl('season5', PAGE_SIZE))
				.flush({ items: SECOND_PAGE, total: TOTAL });

			tagButton('spawn').click();
			tagButton('night').click();
			fixture.detectChanges();
			httpTesting
				.expectOne(pageUrl('season5', 0, 'spawn'))
				.flush({ items: [FIRST_PAGE[0]], total: 1 });
			httpTesting
				.expectOne(pageUrl('season5', 0, 'night,spawn'))
				.flush({ items: [], total: 0 });
			fixture.detectChanges();

			expect(captions()).toEqual([]);
			expect(
				element.querySelector('.page-caption')?.textContent?.trim()
			).toBe('Results: 0');
			expect(rangeLabels()).toEqual(['Page 1 of 1', 'Page 1 of 1']);
			// The header doesn't depend on the filter.
			expect(headerImage()).toBe(SEASON_5_HEADER_IMAGE);
		});

		it('shows every photo again once the filter is cleared', () => {
			tagButton('spawn').click();
			fixture.detectChanges();
			httpTesting
				.expectOne(pageUrl('season5', 0, 'spawn'))
				.flush({ items: [FIRST_PAGE[0]], total: 1 });
			fixture.detectChanges();
			expect(captions()).toEqual(['One']);

			tagButton('Clear').click();
			fixture.detectChanges();
			httpTesting
				.expectOne(pageUrl('season5', 0))
				.flush({ items: FIRST_PAGE, total: TOTAL });
			fixture.detectChanges();

			expect(captions()).toEqual(['One', 'Two']);
		});

		it('goes back to the gallery when the back button is clicked', async () => {
			element.querySelector<HTMLButtonElement>('.back-button')!.click();
			await fixture.whenStable();

			expect(TestBed.inject(Router).url).toBe('/gallery');
		});
	});

	it('shows no tag filter for a collection without tags, or when they fail', () => {
		render('season5', []);
		httpTesting
			.expectOne(pageUrl('season5', 0))
			.flush({ items: FIRST_PAGE, total: TOTAL });
		fixture.detectChanges();

		expect(element.querySelector('app-tag-filter')).toBeNull();
	});

	it('hides the result count until the first page loads', () => {
		render('season5');

		expect(element.querySelector('.page-caption')).toBeNull();

		httpTesting
			.expectOne(pageUrl('season5', 0))
			.flush({ items: FIRST_PAGE, total: TOTAL });
		fixture.detectChanges();

		expect(
			element.querySelector('.page-caption')?.textContent?.trim()
		).toBe(`Results: ${TOTAL}`);
	});

	it('shows an error state when the page fails, and loads it again on Try again', () => {
		render('season5');
		httpTesting
			.expectOne(pageUrl('season5', 0))
			.flush(null, { status: 500, statusText: 'Server Error' });
		fixture.detectChanges();

		expect(
			element.querySelector('app-fallback-panel h2')?.textContent
		).toBe("Couldn't load these photos");
		expect(element.querySelector('mat-paginator')).toBeNull();
		expect(element.querySelector('.back-button')).not.toBeNull();

		element
			.querySelector<HTMLButtonElement>('app-fallback-panel button')!
			.click();
		httpTesting
			.expectOne(pageUrl('season5', 0))
			.flush({ items: FIRST_PAGE, total: TOTAL });
		fixture.detectChanges();

		expect(element.querySelector('app-fallback-panel')).toBeNull();
		expect(captions()).toEqual(['One', 'Two']);
	});

	it('uses the fallback header image for a collection without dimensions', () => {
		render('season6');
		httpTesting
			.expectOne(pageUrl('season6', 0))
			.flush({ items: SECOND_PAGE, total: 1 });
		fixture.detectChanges();

		expect(headerImage()).toBe(GALLERY_FALLBACK_IMAGE);
	});
});
