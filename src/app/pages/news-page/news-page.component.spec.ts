import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsPost } from 'src/app/interfaces/api-responses';
import { environment } from 'src/environments/environment';
import { NewsPageComponent } from './news-page.component';

const PAGE_SIZE = 10;
const TOTAL = 25;
const FIRST_PAGE: NewsPost[] = [
	{ id: '1', title: 'Launch', date: '2026-01-01', content: 'Hi' },
	{ id: '2', title: 'Patch', date: '2026-01-15', content: 'Fixes' }
];
const SECOND_PAGE: NewsPost[] = [
	{ id: '3', title: 'Update', date: '2026-02-01', content: 'More' }
];

describe('NewsPageComponent', () => {
	let fixture: ComponentFixture<NewsPageComponent>;
	let element: HTMLElement;
	let httpTesting: HttpTestingController;

	const pageUrl = (startIndex: number) =>
		`${environment.API_URL}/news?startIndex=${startIndex}&limit=${PAGE_SIZE}`;
	const flushPage = (startIndex: number, items: NewsPost[]) => {
		httpTesting
			.expectOne(pageUrl(startIndex))
			.flush({ items, total: TOTAL });
		fixture.detectChanges();
	};
	const titles = () =>
		[...element.querySelectorAll('.news-post h2')].map(
			(h) => h.textContent
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

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [NewsPageComponent],
			providers: [provideHttpClient(), provideHttpClientTesting()]
		});
		httpTesting = TestBed.inject(HttpTestingController);
		fixture = TestBed.createComponent(NewsPageComponent);
		element = fixture.nativeElement;
		fixture.detectChanges();
		// jsdom doesn't implement scrolling, and vi.spyOn calls through by default.
		vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
	});

	afterEach(() => httpTesting.verify());

	it('shows no news until the first page loads', () => {
		expect(element.querySelector('app-news-display')).toBeNull();

		flushPage(0, FIRST_PAGE);

		expect(titles()).toEqual(['Launch', 'Patch']);
		expect(rangeLabels()).toEqual(['Page 1 of 3', 'Page 1 of 3']);
	});

	it('hides the news display when a page is empty', () => {
		flushPage(0, []);

		expect(element.querySelector('app-news-display')).toBeNull();
	});

	it('loads the next page when Next is clicked, keeping both paginators in sync', () => {
		flushPage(0, FIRST_PAGE);

		clickPaginator('Next page');
		flushPage(PAGE_SIZE, SECOND_PAGE);

		expect(titles()).toEqual(['Update']);
		expect(rangeLabels()).toEqual(['Page 2 of 3', 'Page 2 of 3']);
		expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
	});

	it('shows a visited page again from cache without a new request', () => {
		flushPage(0, FIRST_PAGE);
		clickPaginator('Next page');
		flushPage(PAGE_SIZE, SECOND_PAGE);

		clickPaginator('Previous page');

		// afterEach's verify() fails if this made another request.
		expect(titles()).toEqual(['Launch', 'Patch']);
	});

	it('ignores a late response for a page the user has already left', () => {
		flushPage(0, FIRST_PAGE);
		clickPaginator('Next page');
		clickPaginator('Previous page');

		flushPage(PAGE_SIZE, SECOND_PAGE);
		expect(titles()).toEqual(['Launch', 'Patch']);

		// the late response is still cached for when the user returns
		clickPaginator('Next page');
		expect(titles()).toEqual(['Update']);
	});

	describe('when a page fails to load', () => {
		const failPage = (startIndex: number) => {
			httpTesting
				.expectOne(pageUrl(startIndex))
				.flush(null, { status: 500, statusText: 'Server Error' });
			fixture.detectChanges();
		};
		const fallbackPanel = () => element.querySelector('app-fallback-panel');
		const retryButton = () =>
			element.querySelector<HTMLButtonElement>(
				'app-fallback-panel button'
			)!;

		it('shows an error state in place of the news and paginators', () => {
			failPage(0);

			expect(fallbackPanel()?.querySelector('h2')?.textContent).toBe(
				"Couldn't load the news"
			);
			expect(element.querySelector('mat-paginator')).toBeNull();
		});

		it('keeps the error state up while retrying, then shows the news', () => {
			failPage(0);

			retryButton().click();
			fixture.detectChanges();
			expect(retryButton().getAttribute('aria-disabled')).toBe('true');

			flushPage(0, FIRST_PAGE);
			expect(fallbackPanel()).toBeNull();
			expect(titles()).toEqual(['Launch', 'Patch']);
		});

		it('shows the error state again when the retry fails', () => {
			failPage(0);
			retryButton().click();
			fixture.detectChanges();

			failPage(0);

			expect(fallbackPanel()).not.toBeNull();
			expect(retryButton().hasAttribute('aria-disabled')).toBe(false);
		});

		it('retries the page the user was on', () => {
			flushPage(0, FIRST_PAGE);
			clickPaginator('Next page');
			failPage(PAGE_SIZE);

			retryButton().click();
			flushPage(PAGE_SIZE, SECOND_PAGE);

			expect(titles()).toEqual(['Update']);
		});

		it('ignores a stale request after the user left the page and came back', () => {
			flushPage(0, FIRST_PAGE);
			clickPaginator('Next page');
			clickPaginator('Previous page');
			clickPaginator('Next page');
			const [stale, latest] = httpTesting.match(pageUrl(PAGE_SIZE));

			stale.flush(null, { status: 500, statusText: 'Server Error' });
			fixture.detectChanges();
			expect(fallbackPanel()).toBeNull();

			latest.flush({ items: SECOND_PAGE, total: TOTAL });
			fixture.detectChanges();
			expect(titles()).toEqual(['Update']);
		});

		it('ignores a failure for a page the user has already left', () => {
			flushPage(0, FIRST_PAGE);
			clickPaginator('Next page');
			clickPaginator('Previous page');

			failPage(PAGE_SIZE);

			expect(fallbackPanel()).toBeNull();
			expect(titles()).toEqual(['Launch', 'Patch']);
		});
	});
});
