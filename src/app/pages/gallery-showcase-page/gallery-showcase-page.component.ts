import { Component, inject } from '@angular/core';
import {
	MatPaginatorIntl,
	PageEvent,
	MatPaginator
} from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';
import { GALLERY_FALLBACK_IMAGE } from 'src/app/config/gallery';
import { GALLERY_PAGE_SIZE } from 'src/app/config/pagination';
import { GalleryImage } from 'src/app/interfaces/api-responses';
import { galleryCollectionTitle } from 'src/app/services/gallery-provider/gallery-collection-title';
import { GalleryProviderService } from 'src/app/services/gallery-provider/gallery-provider.service';
import { PaginatorIntlService } from 'src/app/services/paginator-intl/paginator-intl.service';
import { BackgroundImageCardComponent } from '../../components/background-image-card/background-image-card.component';
import { BackButtonComponent } from '../../components/back-button/back-button.component';
import { ImageShowcaseSectionComponent } from './components/image-showcase-section/image-showcase-section.component';
import { FallbackPanelComponent } from '../../components/fallback-panel/fallback-panel.component';
import { LoadState } from '../../components/fallback-panel/load-state';

@Component({
	selector: 'app-gallery-showcase-page',
	templateUrl: './gallery-showcase-page.component.html',
	styleUrls: ['./gallery-showcase-page.component.scss'],
	providers: [{ provide: MatPaginatorIntl, useClass: PaginatorIntlService }],
	imports: [
		BackgroundImageCardComponent,
		BackButtonComponent,
		MatPaginator,
		ImageShowcaseSectionComponent,
		FallbackPanelComponent
	]
})
export class GalleryShowcasePageComponent {
	private route = inject(ActivatedRoute);
	private galleryProvider = inject(GalleryProviderService);

	public title: string;
	/** The collection's first photo, once the first page has loaded. */
	public imageUrl = '';
	public captionedImages: GalleryImage[] = [];
	public collectionName: string;
	public paginationLength?: number;
	public pageSize = GALLERY_PAGE_SIZE;
	public pageIndex = 0;
	public pageEvent!: PageEvent;

	protected readonly loadState = new LoadState();

	/** Counts requests, so only the latest one updates the page. */
	private latestRequest = 0;
	private imageCache: Record<string, GalleryImage[]> = {};

	constructor() {
		this.collectionName = this.route.snapshot.params['collection'];
		this.title = `Gallery: ${galleryCollectionTitle(this.collectionName)}`;
		this.populateCaptionedImages();
	}

	public handlePageEvent(e: PageEvent) {
		this.pageEvent = e;
		this.paginationLength = e.length;
		this.pageSize = e.pageSize;
		this.pageIndex = e.pageIndex;

		// updating the displayed images
		this.captionedImages = [];
		// Any response still on its way is for a page the user has left.
		this.latestRequest++;

		// grabbing images from cache, if they have been cached
		if (this.imageCache[`${this.pageIndex}`]) {
			this.captionedImages = this.imageCache[`${this.pageIndex}`];
		} else {
			this.populateCaptionedImages();
		}

		window.scrollTo(0, 0);
	}

	/** Requests the current page; also the error state's retry. */
	public populateCaptionedImages(): void {
		const requestedPageIndex = this.pageIndex;
		// The user may change page (and come back) before this response
		// arrives, so compare requests, not page indexes.
		const request = ++this.latestRequest;
		const isLatestRequest = () => request === this.latestRequest;

		this.loadState.start();
		this.galleryProvider
			.getCollectionImagesObservable(
				this.collectionName,
				requestedPageIndex * this.pageSize,
				this.pageSize
			)
			.subscribe({
				next: ({ items, total }) => {
					this.imageCache[`${requestedPageIndex}`] = items;
					this.paginationLength = total;
					if (requestedPageIndex === 0) {
						this.imageUrl =
							items[0]?.imageUrl ?? GALLERY_FALLBACK_IMAGE;
					}

					if (isLatestRequest()) {
						this.captionedImages = items;
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
