import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MapSeason } from 'src/app/interfaces/api-responses';
import { ICardSelection } from 'src/app/interfaces/card-selection.interface';
import { MapProviderService } from 'src/app/services/map-provider.service';
import { BackgroundImageCardComponent } from '../../components/background-image-card/background-image-card.component';
import { CardSelectionSectionComponent } from '../../components/card-selection-section/card-selection-section.component';
import { SectionCardComponent } from '../../components/section-card/section-card.component';

interface ISeasonCards {
	title: string;
	cards: ICardSelection[];
}

/** One card per dimension, linking to its BlueMap route (`/map/season-5-nether`). */
function toSeasonCards({ season, dimensions }: MapSeason): ISeasonCards {
	return {
		title: `Season ${season}`,
		cards: dimensions.map(({ name, imageUrl }) => ({
			imageUrl,
			routerLink: `/map/season-${season}-${name.toLowerCase()}`,
			title: name
		}))
	};
}

@Component({
	selector: 'app-page-map',
	templateUrl: './map-page.component.html',
	styleUrls: ['./map-page.component.scss'],
	imports: [
		BackgroundImageCardComponent,
		CardSelectionSectionComponent,
		SectionCardComponent
	]
})
export class MapPageComponent {
	public seasons = toSignal(
		inject(MapProviderService)
			.getMapSeasons()
			.pipe(map((seasons) => seasons.map(toSeasonCards))),
		{ initialValue: [] }
	);
}
