import { Component, inject } from '@angular/core';
import {
	MatPaginatorIntl,
	PageEvent,
	MatPaginator
} from '@angular/material/paginator';
import { INewsItem } from 'src/app/interfaces/news-item.interface';
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
	public pageSize = 10;
	public pageIndex = 0;
	public pageEvent!: PageEvent;
	public newsItems: INewsItem[] = [];

	private newsItemCache: Record<string, INewsItem[]> = {};

	constructor() {
		this.newsItemProvider
			.countNewsItems()
			.subscribe(
				(data: { count: number }) =>
					(this.paginationLength = data.count)
			);

		// setting the initial page items
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

	private populateNewsItems() {
		this.newsItemProvider
			.getNewsItems(this.pageIndex * this.pageSize, this.pageSize)
			.subscribe((data: INewsItem[]) => {
				this.newsItems = data;

				this.newsItemCache[`${this.pageIndex}`] = this.newsItems;
			});
	}
}
