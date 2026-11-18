import { Component, inject } from '@angular/core';
import {
	MatPaginatorIntl,
	PageEvent,
	MatPaginator
} from '@angular/material/paginator';
import { NEWS_PAGE_SIZE } from 'src/app/config/pagination';
import { NewsPost } from 'src/app/interfaces/api-responses';
import { NewsPostProviderService } from 'src/app/services/news-post-provider.service';
import { PaginatorIntlService } from 'src/app/services/paginator-intl.service';
import { BackgroundImageCardComponent } from '../../components/background-image-card/background-image-card.component';
import { NewsDisplayComponent } from '../../components/news/news-display/news-display.component';
import { ErrorStateComponent } from '../../components/error-state/error-state.component';
import { LoadState } from '../../components/error-state/load-state';

@Component({
	selector: 'app-page-news',
	templateUrl: './news-page.component.html',
	styleUrls: ['./news-page.component.scss'],
	providers: [{ provide: MatPaginatorIntl, useClass: PaginatorIntlService }],
	imports: [
		BackgroundImageCardComponent,
		MatPaginator,
		NewsDisplayComponent,
		ErrorStateComponent
	]
})
export class NewsPageComponent {
	private newsPostProvider = inject(NewsPostProviderService);

	public paginationLength!: number;
	public pageSize = NEWS_PAGE_SIZE;
	public pageIndex = 0;
	public pageEvent!: PageEvent;
	public newsPosts: NewsPost[] = [];
	protected readonly loadState = new LoadState();

	private newsPostCache: Record<string, NewsPost[]> = {};

	constructor() {
		this.populateNewsPosts();
	}

	public handlePageEvent(e: PageEvent) {
		this.pageEvent = e;
		this.paginationLength = e.length;
		this.pageSize = e.pageSize;
		this.pageIndex = e.pageIndex;

		// updating the displayed news posts
		this.newsPosts = [];

		// grabbing images from cache, if they have been cached
		if (this.newsPostCache[`${this.pageIndex}`]) {
			this.newsPosts = this.newsPostCache[`${this.pageIndex}`];
		} else {
			this.populateNewsPosts();
		}

		window.scrollTo(0, 0);
	}

	/** Requests the current page again after a failure. */
	public populateNewsPosts(): void {
		// the user may change page before this response arrives
		const requestedPageIndex = this.pageIndex;
		const isCurrentPage = () => requestedPageIndex === this.pageIndex;

		this.loadState.start();
		this.newsPostProvider
			.getNewsPosts(requestedPageIndex * this.pageSize, this.pageSize)
			.subscribe({
				next: ({ items, total }) => {
					this.newsPostCache[`${requestedPageIndex}`] = items;
					this.paginationLength = total;

					if (isCurrentPage()) {
						this.newsPosts = items;
						this.loadState.succeed();
					}
				},
				error: () => {
					if (isCurrentPage()) {
						this.loadState.fail();
					}
				}
			});
	}
}
