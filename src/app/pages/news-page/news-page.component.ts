import { Component, inject } from '@angular/core';
import {
	MatPaginatorIntl,
	PageEvent,
	MatPaginator
} from '@angular/material/paginator';
import { NEWS_PAGE_SIZE } from 'src/app/config/pagination';
import { NewsItem } from 'src/app/interfaces/api-responses';
import { NewsItemProviderService } from 'src/app/services/news-item-provider.service';
import { PaginatorIntlService } from 'src/app/services/paginator-intl.service';
import { BackgroundImageCardComponent } from '../../components/background-image-card/background-image-card.component';
import { NewsDisplayComponent } from '../../components/news/news-display/news-display.component';

@Component({
	selector: 'app-page-news',
	templateUrl: './news-page.component.html',
	styleUrls: ['./news-page.component.scss'],
	providers: [{ provide: MatPaginatorIntl, useClass: PaginatorIntlService }],
	imports: [BackgroundImageCardComponent, MatPaginator, NewsDisplayComponent]
})
export class NewsPageComponent {
	private newsItemProvider = inject(NewsItemProviderService);

	public paginationLength!: number;
	public pageSize = NEWS_PAGE_SIZE;
	public pageIndex = 0;
	public pageEvent!: PageEvent;
	public newsItems: NewsItem[] = [];

	private newsItemCache: Record<string, NewsItem[]> = {};

	constructor() {
		this.populateNewsItems();
	}

	public handlePageEvent(e: PageEvent) {
		this.pageEvent = e;
		this.paginationLength = e.length;
		this.pageSize = e.pageSize;
		this.pageIndex = e.pageIndex;

		// updating the displayed news items
		this.newsItems = [];

		// grabbing images from cache, if they have been cached
		if (this.newsItemCache[`${this.pageIndex}`]) {
			this.newsItems = this.newsItemCache[`${this.pageIndex}`];
		} else {
			this.populateNewsItems();
		}

		window.scrollTo(0, 0);
	}

	private populateNewsItems(): void {
		// the user may change page before this response arrives
		const requestedPageIndex = this.pageIndex;

		this.newsItemProvider
			.getNewsItems(requestedPageIndex * this.pageSize, this.pageSize)
			.subscribe(({ items, total }) => {
				this.newsItemCache[`${requestedPageIndex}`] = items;
				this.paginationLength = total;

				if (requestedPageIndex === this.pageIndex) {
					this.newsItems = items;
				}
			});
	}
}
