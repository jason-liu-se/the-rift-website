import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { INewsItem } from 'src/app/interfaces/news-item.interface';
import { environment } from 'src/environments/environment';
import { NewsPageComponent } from './news-page.component';

const PAGE_SIZE = 10;
const TOTAL = 25;
const FIRST_PAGE: INewsItem[] = [
	{ title: 'Launch', date: '2026-01-01', content: 'Hi' },
	{ title: 'Patch', date: '2026-01-15', content: 'Fixes' }
];
const SECOND_PAGE: INewsItem[] = [
	{ title: 'Update', date: '2026-02-01', content: 'More' }
];

describe('NewsPageComponent', () => {
	let fixture: ComponentFixture<NewsPageComponent>;
	let element: HTMLElement;
	let httpTesting: HttpTestingController;

	const pageUrl = (startIndex: number) =>
		`${environment.API_URL}/news?startIndex=${startIndex}&limit=${PAGE_SIZE}`;
	const flushPage = (startIndex: number, items: INewsItem[]) => {
		httpTesting
			.expectOne(pageUrl(startIndex))
			.flush({ items, total: TOTAL });
		fixture.detectChanges();
	};
	const titles = () =>
		[...element.querySelectorAll('.news-item h2')].map(
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
});
