import { Component, OnInit, Input } from '@angular/core';
import { OPTIMIZED_IMAGE } from 'src/app/directives/image-fallback.directive';

@Component({
	selector: 'app-caption-card',
	templateUrl: './caption-card.component.html',
	styleUrls: ['./caption-card.component.scss'],
	imports: [OPTIMIZED_IMAGE]
})
export class CaptionCardComponent implements OnInit {
	@Input({ required: true }) public src!: string;
	@Input() public alt = '';
	@Input() public caption = '';
	@Input() public captionVisibility!: string; // visible, hidden, hover. Default = visible

	public visibilityType!: string;

	ngOnInit(): void {
		switch (this.captionVisibility) {
			case 'hidden':
				this.visibilityType = 'hidden';
				break;
			case 'hover':
				this.visibilityType = 'hover';
				break;
			default:
				this.visibilityType = 'visible';
		}
	}
}
