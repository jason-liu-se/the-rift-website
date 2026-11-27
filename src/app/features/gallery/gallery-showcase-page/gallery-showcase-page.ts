import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
	MatPaginatorIntl,
	PageEvent,
	MatPaginator
} from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, distinctUntilChanged, map, of } from 'rxjs';
import { GALLERY_FALLBACK_IMAGE } from 'src/app/core/config/gallery';
import { GALLERY_PAGE_SIZE } from 'src/app/core/config/pagination';
import { GalleryImage } from 'src/app/core/api/api-responses';
import { GalleryProviderService } from 'src/app/features/gallery/gallery-provider.service';
import { PaginatorIntlService } from 'src/app/shared/paginator-intl/paginator-intl.service';
import { BackgroundImageCard } from '../../../shared/ui/background-image-card/background-image-card';
import { BackButton } from '../../../shared/ui/back-button/back-button';
import { ImageShowcaseSection } from './image-showcase-section/image-showcase-section';
import { TagFilter } from './tag-filter/tag-filter';
import { FallbackPanel } from '../../../shared/ui/fallback-panel/fallback-panel';
import { LoadState } from '../../../shared/utils/load-state';

/** The query parameter holding the selected tags, comma-separated. */
const TAGS_PARAM = 'tags';

function toTags(param: string | null): string[] {
	return param ? param.split(',').filter(Boolean) : [];
}

@Component({
	selector: 'app-gallery-showcase-page',
	templateUrl: './gallery-showcase-page.html',
	styleUrls: ['./gallery-showcase-page.scss'],
	providers: [{ provide: MatPaginatorIntl, useClass: PaginatorIntlService }],
	imports: [
		BackgroundImageCard,
		BackButton,
		MatPaginator,
		ImageShowcaseSection,
		FallbackPanel,
		TagFilter
	]
})
export class GalleryShowcasePage {
	private route = inject(ActivatedRoute);
	private router = inject(Router);
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
	/** Only photos with every one of these tags are shown (the URL's `tags`). */
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

		// The header shows the first image associated with the collection
		this.galleryProvider
			.fetchCollection(this.collectionName)
			.subscribe(
				(collection) =>
					(this.imageUrl =
						collection?.dimensions?.[0]?.imageUrl ??
						GALLERY_FALLBACK_IMAGE)
			);

		// The selected tags are in the URL, so a filtered view can be shared,
		// and Back restores the previous filter.
		this.route.queryParamMap
			.pipe(
				map((params) => toTags(params.get(TAGS_PARAM))),
				distinctUntilChanged((a, b) => a.join() === b.join()),
				takeUntilDestroyed()
			)
			.subscribe((tags) => this.showTags(tags));
		// Without tags, the page still works; it just can't be filtered.
		this.galleryProvider
			.fetchCollectionTags(this.collectionName)
			.pipe(catchError(() => of([])))
			.subscribe((tags) => this.tags.set(tags));
	}

	/** Filters by `tags`, through the URL. */
	public filterByTags(tags: readonly string[]): void {
		this.router.navigate([], {
			relativeTo: this.route,
			queryParams: { [TAGS_PARAM]: tags.length ? tags.join(',') : null },
			queryParamsHandling: 'merge'
		});
	}

	/** Shows the first page of the photos with every one of `tags`. */
	private showTags(tags: readonly string[]): void {
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
