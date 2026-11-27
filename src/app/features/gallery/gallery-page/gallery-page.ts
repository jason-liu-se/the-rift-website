import { Component, inject, signal } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { GalleryCollection } from 'src/app/core/api/api-responses';
import { CardSelection } from 'src/app/shared/ui/card-selection-section/card-selection';
import { GalleryApi } from 'src/app/features/gallery/gallery-api';
import { BackgroundImageCard } from '../../../shared/ui/background-image-card/background-image-card';
import { CardSelectionSection } from '../../../shared/ui/card-selection-section/card-selection-section';
import { FallbackPanel } from '../../../shared/ui/fallback-panel/fallback-panel';
import { LoadState } from '../../../shared/utils/load-state';
import { galleryCollectionPath } from 'src/app/core/config/site-paths';

@Component({
	selector: 'app-page-gallery',
	templateUrl: './gallery-page.html',
	styleUrls: ['./gallery-page.scss'],
	imports: [BackgroundImageCard, CardSelectionSection, FallbackPanel]
})
export class GalleryPage {
	private galleryApi = inject(GalleryApi);

	/** Undefined until loaded, so "no collections" isn't shown while loading. */
	protected readonly collectionCards = signal<CardSelection[] | undefined>(
		undefined
	);
	protected readonly loadState = new LoadState(() =>
		this.setGalleryCollections()
	);

	constructor() {
		this.setGalleryCollections();
	}

	/** Loads a card for every collection; one failure fails the page. */
	public setGalleryCollections(): void {
		this.loadState.start();
		this.galleryApi
			.fetchCollections()
			.pipe(
				switchMap((collections) =>
					// forkJoin([]) completes without emitting.
					collections.length
						? forkJoin(
								[...collections].sort(bySeason).map(this.toCard)
							)
						: of<CardSelection[]>([])
				)
			)
			.subscribe({
				next: (cards) => {
					this.collectionCards.set(cards);
					this.loadState.succeed();
				},
				error: () => this.loadState.fail()
			});
	}

	/** A collection's card: its first dimension's image (or none), and photo count. */
	private toCard = ({
		slug,
		title,
		dimensions = []
	}: GalleryCollection): Observable<CardSelection> =>
		this.galleryApi.fetchCollectionImages(slug, 0, 1).pipe(
			map(({ total }) => ({
				imageUrl: dimensions[0]?.imageUrl ?? '',
				routerLink: galleryCollectionPath(slug),
				title,
				desc: `${total} photos`
			}))
		);
}

/** `season5` before `season10`, which the API's plain slug sort gets wrong. */
function bySeason(a: GalleryCollection, b: GalleryCollection): number {
	return a.slug.localeCompare(b.slug, undefined, { numeric: true });
}
