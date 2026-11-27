import { Component, Input } from '@angular/core';
import { ICardSelection } from 'src/app/shared/ui/card-selection-section/card-selection.interface';
import { RouterLink } from '@angular/router';
import { OptimizedImageComponent } from 'src/app/shared/ui/optimized-image/optimized-image.component';

@Component({
	selector: 'app-card-selection-section',
	templateUrl: './card-selection-section.component.html',
	styleUrls: ['./card-selection-section.component.scss'],
	imports: [RouterLink, OptimizedImageComponent]
})
export class CardSelectionSectionComponent {
	@Input({ required: true })
	public items!: ICardSelection[];

	@Input() public alwaysShowDesc = false;
}
