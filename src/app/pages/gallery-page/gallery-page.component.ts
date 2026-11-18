import { Component, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { IGalleryCardSelection } from 'src/app/interfaces/gallery-card-selection.interface';
import { GalleryProviderService } from 'src/app/services/gallery-provider.service';
import { BackgroundImageCardComponent } from '../../components/background-image-card/background-image-card.component';
import { CardSelectionSectionComponent } from '../../components/card-selection-section/card-selection-section.component';
import { ErrorStateComponent } from '../../components/error-state/error-state.component';
import { LoadState } from '../../components/error-state/load-state';

@Component({
	selector: 'app-page-gallery',
	templateUrl: './gallery-page.component.html',
	styleUrls: ['./gallery-page.component.scss'],
	imports: [
		BackgroundImageCardComponent,
		CardSelectionSectionComponent,
		ErrorStateComponent
	]
})
export class GalleryPageComponent {
	private galleryProvider = inject(GalleryProviderService);

	public galleryCollections: IGalleryCardSelection[] = [
		{
			imageUrl:
				'../../../assets/general-background-images/season-5-circle.webp',
			routerLink: '/gallery/season-5',
			title: 'Season 5',
			desc: '',
			dbCollectionName: 'season-5'
		},
		{
			imageUrl:
				'../../../assets/general-background-images/magic-books-2.webp',
			routerLink: '/gallery/season-6',
			title: 'Season 6',
			desc: '',
			dbCollectionName: 'season-6'
		}
	];
	protected readonly loadState = new LoadState();

	constructor() {
		this.setGalleryCollections();
	}

	/** Loads every collection's photo count; one failure fails the page. */
	public setGalleryCollections(): void {
		this.loadState.start();
		forkJoin(
			this.galleryCollections.map((collection) =>
				this.galleryProvider.getCollectionImageCountObservable(
					collection.dbCollectionName
				)
			)
		).subscribe({
			next: (counts) => {
				counts.forEach(({ total }, i) => {
					this.galleryCollections[i].desc = `${total} photos`;
				});
				this.loadState.succeed();
			},
			error: () => this.loadState.fail()
		});
	}
}
