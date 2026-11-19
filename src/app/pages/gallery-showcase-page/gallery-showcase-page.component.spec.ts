import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';

import { GALLERY_FALLBACK_IMAGE } from 'src/app/config/gallery';
import { GalleryImage } from 'src/app/interfaces/api-responses';
import { ANY_URL_ROUTES } from 'src/app/testing/render-component';
import { environment } from 'src/environments/environment';
import { GalleryShowcasePageComponent } from './gallery-showcase-page.component';

const PAGE_SIZE = 30;
const TOTAL = 31;
const FIRST_PAGE: GalleryImage[] = [
	{ id: '1', imageUrl: 'one.png', caption: 'One' },
	{ id: '2', imageUrl: 'two.png', caption: 'Two' }
];
const SECOND_PAGE: GalleryImage[] = [
	{ id: '3', imageUrl: 'three.png', caption: 'Three' }
];

describe('GalleryShowcasePageComponent', () => {
	let fixture: ComponentFixture<GalleryShowcasePageComponent>;
	let element: HTMLElement;
	let httpTesting: HttpTestingController;
	let routeParams: Record<string, string>;

	const pageUrl = (collection: string, startIndex: number) =>
		`${environment.API_URL}/gallery/${collection}?startIndex=${startIndex}&limit=${PAGE_SIZE}`;
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

	function render(collection: string): void {
		routeParams['collection'] = collection;
		fixture = TestBed.createComponent(GalleryShowcasePageComponent);
		element = fixture.nativeElement;
		fixture.detectChanges();
	}

	beforeEach(() => {
		routeParams = {};
		TestBed.configureTestingModule({
			imports: [GalleryShowcasePageComponent],
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter(ANY_URL_ROUTES),
				{
					provide: ActivatedRoute,
					useFactory: () => ({ snapshot: { params: routeParams } })
				}
			]
		});
		httpTesting = TestBed.inject(HttpTestingController);
	});

	afterEach(() => httpTesting.verify());

	describe('with a collection in the URL', () => {
		beforeEach(() => {
			render('season5');
			httpTesting
				.expectOne(pageUrl('season5', 0))
				.flush({ items: FIRST_PAGE, total: TOTAL });
			fixture.detectChanges();
		});

		it("shows the collection's name and first photo as the page header", () => {
			const header = element.querySelector('.background-image-card img');

			expect(element.querySelector('h1')?.textContent).toBe(
				'Gallery: Season 5'
			);
			expect(header?.getAttribute('src')).toBe(FIRST_PAGE[0].imageUrl);
		});

		it('shows the first page of the collection and its total', () => {
			expect(captions()).toEqual(['One', 'Two']);
			expect(element.querySelector('.page-caption')?.textContent).toBe(
				`Results: ${TOTAL}`
			);
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

		it('goes back to the gallery when the back button is clicked', async () => {
			element.querySelector<HTMLButtonElement>('.back-button')!.click();
			await fixture.whenStable();

			expect(TestBed.inject(Router).url).toBe('/gallery');
		});
	});

	it('hides the result count until the first page loads', () => {
		render('season5');

		expect(element.querySelector('.page-caption')).toBeNull();

		httpTesting
			.expectOne(pageUrl('season5', 0))
			.flush({ items: FIRST_PAGE, total: TOTAL });
		fixture.detectChanges();

		expect(element.querySelector('.page-caption')?.textContent).toBe(
			`Results: ${TOTAL}`
		);
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

	it('uses the fallback header image for a collection with no photos', () => {
		render('season5');
		httpTesting
			.expectOne(pageUrl('season5', 0))
			.flush({ items: [], total: 0 });
		fixture.detectChanges();

		expect(
			element
				.querySelector('.background-image-card img')
				?.getAttribute('src')
		).toBe(GALLERY_FALLBACK_IMAGE);
	});
});
