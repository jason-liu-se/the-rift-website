import { Component, OnInit, Input } from '@angular/core';

@Component({
	selector: 'app-caption-card',
	templateUrl: './caption-card.component.html',
	styleUrls: ['./caption-card.component.scss']
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
