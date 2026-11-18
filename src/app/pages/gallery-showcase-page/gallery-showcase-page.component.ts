import { Component, inject } from '@angular/core';
import {
	MatPaginatorIntl,
	PageEvent,
	MatPaginator
} from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';
import { GALLERY_PAGE_SIZE } from 'src/app/config/pagination';
import { GalleryImage } from 'src/app/interfaces/api-responses';
import { GalleryProviderService } from 'src/app/services/gallery-provider.service';
import { PaginatorIntlService } from 'src/app/services/paginator-intl.service';
import { BackgroundImageCardComponent } from '../../components/background-image-card/background-image-card.component';
import { BackButtonComponent } from '../../components/back-button/back-button.component';
import { ImageShowcaseSectionComponent } from './components/image-showcase-section/image-showcase-section.component';
import { ErrorStateComponent } from '../../components/error-state/error-state.component';
import { LoadState } from '../../components/error-state/load-state';

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
		ErrorStateComponent
	]
})
export class GalleryShowcasePageComponent {
	private route = inject(ActivatedRoute);
	private galleryProvider = inject(GalleryProviderService);

	public title: string;
	public imageUrl: string;
	public captionedImages: GalleryImage[] = [];
	public collectionName: string;
	public paginationLength?: number;
	public pageSize = GALLERY_PAGE_SIZE;
	public pageIndex = 0;
	public pageEvent!: PageEvent;

	protected readonly loadState = new LoadState();

	private imageCache: Record<string, GalleryImage[]> = {};

	// the title and imageUrl must be passed via the app.routes.ts file as
	// 'data' elements
	constructor() {
		// parsing route data
		const title = this.route.snapshot.data['title'];
		const imageUrl = this.route.snapshot.data['imageUrl'];
		const collectionName = this.route.snapshot.data['collection'];

		this.title = title == null ? 'Gallery Showcase Page' : title;
		this.imageUrl = imageUrl == null ? '' : imageUrl;
		this.collectionName = collectionName == null ? '' : collectionName;

		this.populateCaptionedImages();
	}

	public handlePageEvent(e: PageEvent) {
		this.pageEvent = e;
		this.paginationLength = e.length;
		this.pageSize = e.pageSize;
		this.pageIndex = e.pageIndex;

		// updating the displayed images
		this.captionedImages = [];

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
		if (!this.collectionName) {
			return;
		}

		// the user may change page before this response arrives
		const requestedPageIndex = this.pageIndex;
		const isCurrentPage = () => requestedPageIndex === this.pageIndex;

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

					if (isCurrentPage()) {
						this.captionedImages = items;
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
