import { Component, inject, signal } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { GalleryCollection } from 'src/app/core/api/api-responses';
import { ICardSelection } from 'src/app/shared/ui/card-selection-section/card-selection.interface';
import { GalleryProviderService } from 'src/app/features/gallery/gallery-provider.service';
import { BackgroundImageCardComponent } from '../../../shared/ui/background-image-card/background-image-card.component';
import { CardSelectionSectionComponent } from '../../../shared/ui/card-selection-section/card-selection-section.component';
import { FallbackPanelComponent } from '../../../shared/ui/fallback-panel/fallback-panel.component';
import { LoadState } from '../../../shared/utils/load-state';

@Component({
	selector: 'app-page-gallery',
	templateUrl: './gallery-page.component.html',
	styleUrls: ['./gallery-page.component.scss'],
	imports: [
		BackgroundImageCardComponent,
		CardSelectionSectionComponent,
		FallbackPanelComponent
	]
})
export class GalleryPageComponent {
	private galleryProvider = inject(GalleryProviderService);

	/** Undefined until loaded, so "no collections" isn't shown while loading. */
	protected readonly collectionCards = signal<ICardSelection[] | undefined>(
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
		this.galleryProvider
			.fetchCollections()
			.pipe(
				switchMap((collections) =>
					// forkJoin([]) completes without emitting.
					collections.length
						? forkJoin(
								[...collections].sort(bySeason).map(this.toCard)
							)
						: of<ICardSelection[]>([])
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
	}: GalleryCollection): Observable<ICardSelection> =>
		this.galleryProvider.fetchCollectionImages(slug, 0, 1).pipe(
			map(({ total }) => ({
				imageUrl: dimensions[0]?.imageUrl ?? '',
				routerLink: `/gallery/${encodeURIComponent(slug)}`,
				title,
				desc: `${total} photos`
			}))
		);
}

/** `season5` before `season10`, which the API's plain slug sort gets wrong. */
function bySeason(a: GalleryCollection, b: GalleryCollection): number {
	return a.slug.localeCompare(b.slug, undefined, { numeric: true });
}
