import { Component, inject, signal } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { GALLERY_CARD_DIMENSION } from 'src/app/config/gallery';
import { Dimension, GalleryCollection } from 'src/app/interfaces/api-responses';
import { ICardSelection } from 'src/app/interfaces/card-selection.interface';
import { GalleryProviderService } from 'src/app/services/gallery-provider/gallery-provider.service';
import { BackgroundImageCardComponent } from '../../components/background-image-card/background-image-card.component';
import { CardSelectionSectionComponent } from '../../components/card-selection-section/card-selection-section.component';
import { FallbackPanelComponent } from '../../components/fallback-panel/fallback-panel.component';
import { LoadState } from '../../utilities/load-state';

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

	/** A collection's card: its card dimension's image, and its photo count. */
	private toCard = ({
		slug,
		title,
		dimensions = []
	}: GalleryCollection): Observable<ICardSelection> =>
		this.galleryProvider.fetchCollectionImages(slug, 0, 1).pipe(
			map(({ total }) => ({
				imageUrl: cardImageOf(dimensions),
				routerLink: `/gallery/${encodeURIComponent(slug)}`,
				title,
				desc: `${total} photos`
			}))
		);
}

/** The card dimension's image, or none (a blank card). */
function cardImageOf(dimensions: readonly Dimension[]): string {
	const name = GALLERY_CARD_DIMENSION.toLowerCase();
	return (
		dimensions.find((dimension) => dimension.name.toLowerCase() === name)
			?.imageUrl ?? ''
	);
}

/** `season5` before `season10`, which the API's plain slug sort gets wrong. */
function bySeason(a: GalleryCollection, b: GalleryCollection): number {
	return a.slug.localeCompare(b.slug, undefined, { numeric: true });
}
