import { Component, Input } from '@angular/core';
import { ICardSelection } from 'src/app/shared/ui/card-selection-section/card-selection.interface';
import { RouterLink } from '@angular/router';
import { OptimizedImage } from 'src/app/shared/ui/optimized-image/optimized-image';

@Component({
	selector: 'app-card-selection-section',
	templateUrl: './card-selection-section.html',
	styleUrls: ['./card-selection-section.scss'],
	imports: [RouterLink, OptimizedImage]
})
export class CardSelectionSection {
	@Input({ required: true })
	public items!: ICardSelection[];

	@Input() public alwaysShowDesc = false;
}
