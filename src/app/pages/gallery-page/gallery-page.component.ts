import { Component, inject } from '@angular/core';
import { IGalleryCardSelection } from 'src/app/interfaces/gallery-card-selection.interface';
import { GalleryProviderService } from 'src/app/services/gallery-provider.service';
import { BackgroundImageCardComponent } from '../../components/background-image-card/background-image-card.component';
import { CardSelectionSectionComponent } from '../../components/card-selection-section/card-selection-section.component';

@Component({
	selector: 'app-page-gallery',
	templateUrl: './gallery-page.component.html',
	styleUrls: ['./gallery-page.component.scss'],
	imports: [BackgroundImageCardComponent, CardSelectionSectionComponent]
})
export class GalleryPageComponent {
	private galleryProvider = inject(GalleryProviderService);

	public galleryCollections: IGalleryCardSelection[] = [
		{
			imageUrl:
				'../../../assets/general-background-images/season-5-circle.png',
			routerLink: '/gallery/season-5',
			title: 'Season 5',
			desc: '',
			dbCollectionName: 'season-5'
		},
		{
			imageUrl:
				'../../../assets/general-background-images/magic-books-2.jpg',
			routerLink: '/gallery/season-6',
			title: 'Season 6',
			desc: '',
			dbCollectionName: 'season-6'
		}
	];

	constructor() {
		this.setGalleryCollections();
	}

	private setGalleryCollections(): void {
		for (const collection of this.galleryCollections) {
			this.galleryProvider
				.getCollectionImageCountObservable(collection.dbCollectionName)
				.subscribe((data) => {
					collection.desc = `${data.total} photos`;
				});
		}
	}
}
