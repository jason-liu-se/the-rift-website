import { Component, inject } from '@angular/core';
import {
	MatPaginatorIntl,
	PageEvent,
	MatPaginator
} from '@angular/material/paginator';
import { NEWS_PAGE_SIZE } from 'src/app/core/config/pagination';
import { NewsPost } from 'src/app/core/api/api-responses';
import { NewsApi } from 'src/app/features/news/news-api';
import { PaginatorIntl } from 'src/app/shared/paginator-intl/paginator-intl';
import { BackgroundImageCard } from '../../../shared/ui/background-image-card/background-image-card';
import { NewsDisplay } from '../news-display/news-display';
import { FallbackPanel } from '../../../shared/ui/fallback-panel/fallback-panel';
import { LoadState } from '../../../shared/utils/load-state';

@Component({
	selector: 'app-page-news',
	templateUrl: './news-page.html',
	styleUrls: ['./news-page.scss'],
	providers: [{ provide: MatPaginatorIntl, useClass: PaginatorIntl }],
	imports: [BackgroundImageCard, MatPaginator, NewsDisplay, FallbackPanel]
})
export class NewsPage {
	private newsApi = inject(NewsApi);

	public paginationLength!: number;
	public pageSize = NEWS_PAGE_SIZE;
	public pageIndex = 0;
	public pageEvent!: PageEvent;
	public newsPosts: NewsPost[] = [];
	protected readonly loadState = new LoadState(() =>
		this.populateNewsPosts()
	);

	/** Counts requests, so only the latest one updates the page. */
	private latestRequest = 0;

	constructor() {
		this.populateNewsPosts();
	}

	public handlePageEvent(e: PageEvent) {
		this.pageEvent = e;
		this.paginationLength = e.length;
		this.pageSize = e.pageSize;
		this.pageIndex = e.pageIndex;

		this.newsPosts = [];
		this.populateNewsPosts();

		window.scrollTo(0, 0);
	}

	/** Requests the current page; also the error state's retry. */
	public populateNewsPosts(): void {
		const requestedPageIndex = this.pageIndex;
		// The user may change page (and come back) before this response
		// arrives, so compare requests, not page indexes.
		const request = ++this.latestRequest;
		const isLatestRequest = () => request === this.latestRequest;

		this.loadState.start();
		this.newsApi
			.getNewsPosts(requestedPageIndex * this.pageSize, this.pageSize)
			.subscribe({
				next: ({ items, total }) => {
					if (isLatestRequest()) {
						this.newsPosts = items;
						this.paginationLength = total;
						this.loadState.succeed();
					}
				},
				error: () => {
					if (isLatestRequest()) {
						this.loadState.fail();
					}
				}
			});
	}
}
