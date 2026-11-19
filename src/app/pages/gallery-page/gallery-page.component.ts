import { Component, inject, signal } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { GALLERY_FALLBACK_IMAGE } from 'src/app/config/gallery';
import { ICardSelection } from 'src/app/interfaces/card-selection.interface';
import { galleryCollectionTitle } from 'src/app/services/gallery-provider/gallery-collection-title';
import { GalleryProviderService } from 'src/app/services/gallery-provider/gallery-provider.service';
import { BackgroundImageCardComponent } from '../../components/background-image-card/background-image-card.component';
import { CardSelectionSectionComponent } from '../../components/card-selection-section/card-selection-section.component';
import { FallbackPanelComponent } from '../../components/fallback-panel/fallback-panel.component';
import { LoadState } from '../../components/fallback-panel/load-state';

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
	protected readonly loadState = new LoadState();

	constructor() {
		this.setGalleryCollections();
	}

	/** Loads a card for every collection; one failure fails the page. */
	public setGalleryCollections(): void {
		this.loadState.start();
		this.galleryProvider
			.getCollectionNamesObservable()
			.pipe(
				switchMap((names) =>
					// forkJoin([]) completes without emitting.
					names.length
						? forkJoin([...names].sort(bySeason).map(this.toCard))
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

	/** A collection's card, using its first photo and photo count. */
	private toCard = (name: string): Observable<ICardSelection> =>
		this.galleryProvider.getCollectionImagesObservable(name, 0, 1).pipe(
			map(({ items, total }) => ({
				imageUrl: items[0]?.imageUrl ?? GALLERY_FALLBACK_IMAGE,
				routerLink: `/gallery/${encodeURIComponent(name)}`,
				title: galleryCollectionTitle(name),
				desc: `${total} photos`
			}))
		);
}

/** `season5` before `season10`, which a plain string sort gets wrong. */
function bySeason(a: string, b: string): number {
	return a.localeCompare(b, undefined, { numeric: true });
}
