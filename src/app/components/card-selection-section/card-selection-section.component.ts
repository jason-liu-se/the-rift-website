import { Component, Input } from '@angular/core';
import { ICardSelection } from 'src/app/interfaces/card-selection.interface';
import { RouterLink } from '@angular/router';
import { OPTIMIZED_IMAGE } from 'src/app/directives/image-fallback.directive';

@Component({
	selector: 'app-card-selection-section',
	templateUrl: './card-selection-section.component.html',
	styleUrls: ['./card-selection-section.component.scss'],
	imports: [RouterLink, OPTIMIZED_IMAGE]
})
export class CardSelectionSectionComponent {
	@Input({ required: true })
	public items!: ICardSelection[];

	@Input() public alwaysShowDesc = false;
}
