import { Component, inject, signal } from '@angular/core';
import { MapSeason } from 'src/app/interfaces/api-responses';
import { ICardSelection } from 'src/app/interfaces/card-selection.interface';
import { MapProviderService } from 'src/app/services/map-provider/map-provider.service';
import { EditButtonComponent } from '../../components/edit-button/edit-button.component';
import { BackgroundImageCardComponent } from '../../components/background-image-card/background-image-card.component';
import { CardSelectionSectionComponent } from '../../components/card-selection-section/card-selection-section.component';
import { SectionCardComponent } from '../../components/section-card/section-card.component';
import { FallbackPanelComponent } from '../../components/fallback-panel/fallback-panel.component';
import { LoadState } from '../../utilities/load-state';

interface ISeasonCards {
	id: string;
	title: string;
	cards: ICardSelection[];
}

const MAP_VIEWER_ROUTE = '/map/viewer';
/** Camera mode at the end of every BlueMap URL fragment. */
const BLUEMAP_CAMERA_MODE = 'perspective';

/**
 * One card per dimension, opening the map viewer with the same fragment
 * BlueMap uses (`#s6_overworld:0:0:0:1500:0:0:0:0:perspective`).
 */
function toSeasonCards({ id, season, dimensions }: MapSeason): ISeasonCards {
	return {
		id,
		title: `Season ${season}`,
		cards: dimensions.map(({ name, imageUrl, worldId, perspective }) => ({
			imageUrl,
			routerLink: MAP_VIEWER_ROUTE,
			fragment: `${worldId}${perspective}${BLUEMAP_CAMERA_MODE}`,
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
		EditButtonComponent,
		SectionCardComponent,
		FallbackPanelComponent
	]
})
export class MapPageComponent {
	private mapProvider = inject(MapProviderService);

	public readonly seasons = signal<ISeasonCards[]>([]);
	protected readonly loadState = new LoadState(() => this.loadSeasons());

	constructor() {
		this.loadSeasons();
	}

	public loadSeasons(): void {
		this.loadState.start();
		this.mapProvider.getMapSeasons().subscribe({
			next: (seasons) => {
				this.seasons.set(seasons.map(toSeasonCards));
				this.loadState.succeed();
			},
			error: () => this.loadState.fail()
		});
	}
}
