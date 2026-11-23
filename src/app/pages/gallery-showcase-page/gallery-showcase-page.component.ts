import { Component, inject, signal } from '@angular/core';
import {
	MatPaginatorIntl,
	PageEvent,
	MatPaginator
} from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';
import { catchError, of } from 'rxjs';
import { GALLERY_FALLBACK_IMAGE } from 'src/app/config/gallery';
import { GALLERY_PAGE_SIZE } from 'src/app/config/pagination';
import { GalleryImage } from 'src/app/interfaces/api-responses';
import { GalleryProviderService } from 'src/app/services/gallery-provider/gallery-provider.service';
import { PaginatorIntlService } from 'src/app/services/paginator-intl/paginator-intl.service';
import { BackgroundImageCardComponent } from '../../components/background-image-card/background-image-card.component';
import { BackButtonComponent } from '../../components/back-button/back-button.component';
import { ImageShowcaseSectionComponent } from './components/image-showcase-section/image-showcase-section.component';
import { TagFilterComponent } from './components/tag-filter/tag-filter.component';
import { FallbackPanelComponent } from '../../components/fallback-panel/fallback-panel.component';
import { LoadState } from '../../utilities/load-state';

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
		FallbackPanelComponent,
		TagFilterComponent
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
	/** The collection's tags, for filtering; empty until loaded, or if that fails. */
	protected readonly tags = signal<readonly string[]>([]);
	/** Only photos with every one of these tags are shown. */
	protected readonly selectedTags = signal<readonly string[]>([]);

	protected readonly loadState = new LoadState(() =>
		this.populateCaptionedImages()
	);

	/** Counts requests, so only the latest one updates the page. */
	private latestRequest = 0;
	private imageCache: Record<string, GalleryImage[]> = {};

	constructor() {
		const { params, data } = this.route.snapshot;
		this.collectionName = params['collection'];
		this.title = `Gallery: ${data['collectionTitle']}`;
		this.populateCaptionedImages();
		// Without tags, the page still works; it just can't be filtered.
		this.galleryProvider
			.fetchCollectionTags(this.collectionName)
			.pipe(catchError(() => of([])))
			.subscribe((tags) => this.tags.set(tags));
	}

	/** Shows the first page of the photos with every one of `tags`. */
	public filterByTags(tags: readonly string[]): void {
		this.selectedTags.set(tags);
		this.imageCache = {};
		this.pageIndex = 0;
		this.captionedImages = [];
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
		const requestedTags = this.selectedTags();
		// The user may change page (and come back) before this response
		// arrives, so compare requests, not page indexes.
		const request = ++this.latestRequest;
		const isLatestRequest = () => request === this.latestRequest;

		this.loadState.start();
		this.galleryProvider
			.fetchCollectionImages(
				this.collectionName,
				requestedPageIndex * this.pageSize,
				this.pageSize,
				requestedTags
			)
			.subscribe({
				next: ({ items, total }) => {
					// The header shows the whole collection's first photo.
					if (
						requestedPageIndex === 0 &&
						requestedTags.length === 0
					) {
						this.imageUrl =
							items[0]?.imageUrl ?? GALLERY_FALLBACK_IMAGE;
					}
					// The cache holds pages of the current filter only.
					if (requestedTags !== this.selectedTags()) {
						return;
					}
					this.imageCache[`${requestedPageIndex}`] = items;
					this.paginationLength = total;
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
