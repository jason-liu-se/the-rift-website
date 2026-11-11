import { Component } from '@angular/core';
import { ICardSelection } from 'src/app/interfaces/card-selection.interface';
import { BackgroundImageCardComponent } from '../../components/background-image-card/background-image-card.component';
import { CardSelectionSectionComponent } from '../../components/card-selection-section/card-selection-section.component';

@Component({
	selector: 'app-page-map',
	templateUrl: './map-page.component.html',
	styleUrls: ['./map-page.component.scss'],
	imports: [BackgroundImageCardComponent, CardSelectionSectionComponent]
})
export class MapPageComponent {
	public mapItems: ICardSelection[] = [
		{
			imageUrl:
				'../../../assets/general-background-images/season-5-circle.webp',
			routerLink: '/map/season-5-overworld',
			title: 'Season 5',
			desc: 'Overworld'
		},
		{
			imageUrl:
				'../../../assets/general-background-images/season-5-circle.webp',
			routerLink: '/map/season-5-nether',
			title: 'Season 5',
			desc: 'Nether'
		},
		{
			imageUrl:
				'../../../assets/general-background-images/season-5-circle.webp',
			routerLink: '/map/season-5-end',
			title: 'Season 5',
			desc: 'End'
		}
	];
}
