import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';

import { ICaptionCard } from 'src/app/interfaces/slideshow-image.interface';
import { ANY_URL_ROUTES } from 'src/app/testing/render-component';
import { environment } from 'src/environments/environment';
import { GalleryShowcasePageComponent } from './gallery-showcase-page.component';

const PAGE_SIZE = 30;
const TOTAL = 31;
const FIRST_PAGE: ICaptionCard[] = [
	{ url: 'one.png', caption: 'One' },
	{ url: 'two.png', caption: 'Two' }
];
const SECOND_PAGE: ICaptionCard[] = [{ url: 'three.png', caption: 'Three' }];

describe('GalleryShowcasePageComponent', () => {
	let fixture: ComponentFixture<GalleryShowcasePageComponent>;
	let element: HTMLElement;
	let httpTesting: HttpTestingController;
	let routeData: Record<string, unknown>;

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

	function render(data: Record<string, unknown>): void {
		Object.assign(routeData, data);
		fixture = TestBed.createComponent(GalleryShowcasePageComponent);
		element = fixture.nativeElement;
		fixture.detectChanges();
	}

	beforeEach(() => {
		routeData = {};
		TestBed.configureTestingModule({
			imports: [GalleryShowcasePageComponent],
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter(ANY_URL_ROUTES),
				{
					provide: ActivatedRoute,
					useFactory: () => ({ snapshot: { data: routeData } })
				}
			]
		});
		httpTesting = TestBed.inject(HttpTestingController);
	});

	afterEach(() => httpTesting.verify());

	describe('with a collection in the route data', () => {
		beforeEach(() => {
			render({
				title: 'Gallery: Season 5',
				imageUrl: 'assets/season-5.png',
				collection: 'season-5'
			});
			httpTesting
				.expectOne(pageUrl('season-5', 0))
				.flush({ items: FIRST_PAGE, total: TOTAL });
			fixture.detectChanges();
		});

		it('shows the route title and background as the page header', () => {
			const header = element.querySelector<HTMLElement>(
				'.background-image-card'
			);

			expect(element.querySelector('h1')?.textContent).toBe(
				'Gallery: Season 5'
			);
			expect(header?.style.backgroundImage).toContain(
				'assets/season-5.png'
			);
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
				.expectOne(pageUrl('season-5', PAGE_SIZE))
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
				.expectOne(pageUrl('season-5', PAGE_SIZE))
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
				.expectOne(pageUrl('season-5', PAGE_SIZE))
				.flush({ items: SECOND_PAGE, total: TOTAL });
			fixture.detectChanges();
			expect(captions()).toEqual(['One', 'Two']);

			// the late response is still cached for when the user returns
			clickPaginator('Next page');
			expect(captions()).toEqual(['Three']);
		});

		it('goes back to the gallery when the back button is clicked', async () => {
			element.querySelector<HTMLButtonElement>('.back-button')!.click();
			await fixture.whenStable();

			expect(TestBed.inject(Router).url).toBe('/gallery');
		});
	});

	it('hides the result count until the first page loads', () => {
		render({ collection: 'season-5' });

		expect(element.querySelector('.page-caption')).toBeNull();

		httpTesting
			.expectOne(pageUrl('season-5', 0))
			.flush({ items: FIRST_PAGE, total: TOTAL });
		fixture.detectChanges();

		expect(element.querySelector('.page-caption')?.textContent).toBe(
			`Results: ${TOTAL}`
		);
	});

	it('shows a generic title and requests nothing when the route has no data', () => {
		render({});

		// afterEach's verify() fails if any request was made.
		expect(element.querySelector('h1')?.textContent).toBe(
			'Gallery Showcase Page'
		);
		expect(element.querySelector('.page-caption')).toBeNull();
	});
});
