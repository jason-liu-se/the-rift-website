import { Component, OnInit, Input } from '@angular/core';
import { OptimizedImage } from 'src/app/shared/ui/optimized-image/optimized-image';

@Component({
	selector: 'app-caption-card',
	templateUrl: './caption-card.html',
	styleUrls: ['./caption-card.scss'],
	imports: [OptimizedImage]
})
export class CaptionCard implements OnInit {
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
