import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatPaginator } from '@angular/material/paginator';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { Constants } from 'src/app/config/constants';
import { INewsItem } from 'src/app/interfaces/news-item.interface';
import { NewsPageComponent } from './news-page.component';

describe('NewsPageComponent', () => {
	const newsUrl = `${new Constants().API_ENDPOINT}/news`;
	const firstPage: INewsItem[] = [
		{ title: 'Launch', date: '2026-01-01', content: 'Hi' }
	];
	const secondPage: INewsItem[] = [
		{ title: 'Update', date: '2026-02-01', content: 'More' }
	];
	let component: NewsPageComponent;
	let fixture: ComponentFixture<NewsPageComponent>;
	let httpTesting: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [NewsPageComponent],
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter([]),
				provideNoopAnimations()
			]
		});
		httpTesting = TestBed.inject(HttpTestingController);
		fixture = TestBed.createComponent(NewsPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();

		httpTesting
			.expectOne(`${newsUrl}?startIndex=0&limit=10`)
			.flush({ items: firstPage, total: 25 });
		fixture.detectChanges();
	});

	afterEach(() => httpTesting.verify());

	it('renders the first page and sizes both paginators from its total', () => {
		const paginators = fixture.debugElement
			.queryAll(By.directive(MatPaginator))
			.map((debugElement) => debugElement.componentInstance);

		expect(component.newsItems).toEqual(firstPage);
		expect(paginators.length).toBe(2);
		expect(paginators.every((p) => p.length === 25)).toBe(true);
		expect(
			fixture.nativeElement.querySelector('app-news-display')
		).not.toBeNull();
	});

	it('fetches a new page from its offset and reuses cached pages', () => {
		// jsdom doesn't implement scrolling, and vi.spyOn calls through by default.
		vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

		component.handlePageEvent({ pageIndex: 2, pageSize: 10, length: 25 });
		httpTesting
			.expectOne(`${newsUrl}?startIndex=20&limit=10`)
			.flush({ items: secondPage, total: 25 });
		expect(component.newsItems).toEqual(secondPage);

		component.handlePageEvent({ pageIndex: 0, pageSize: 10, length: 25 });
		// afterEach's verify() fails if this triggered another request.
		expect(component.newsItems).toEqual(firstPage);
		expect(window.scrollTo).toHaveBeenCalledTimes(2);
	});
});
