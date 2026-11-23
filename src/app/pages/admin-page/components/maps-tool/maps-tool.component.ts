import { Component } from '@angular/core';
import { DEFAULT_MAP_DIMENSIONS } from 'src/app/config/maps';
import { ContentToolComponent } from '../content-tool/content-tool.component';
import { FilterOption } from '../editor-list/list-filters/list-filters.component';
import { MapsFormComponent } from './maps-form/maps-form.component';

/** Creates, edits, and deletes map seasons and their dimensions. */
@Component({
	selector: 'app-maps-tool',
	templateUrl: './maps-tool.component.html',
	styleUrl: './maps-tool.component.scss',
	imports: [ContentToolComponent, MapsFormComponent]
})
export class MapsToolComponent {
	protected readonly noun = { one: 'season', many: 'seasons' };
	protected readonly searchFields: FilterOption[] = [
		{ value: 'season', label: 'Season number' },
		{ value: 'dimensions', label: 'Dimension names' }
	];
	protected readonly newSeasonFields = {
		dimensions: DEFAULT_MAP_DIMENSIONS.map((dimension) => ({
			...dimension
		}))
	};
}
