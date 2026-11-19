import { Component, Input, OnInit } from '@angular/core';
import { OPTIMIZED_IMAGE } from 'src/app/directives/image-fallback.directive';

@Component({
	selector: 'app-background-image-card',
	templateUrl: './background-image-card.component.html',
	styleUrls: ['./background-image-card.component.scss'],
	imports: [OPTIMIZED_IMAGE]
})
export class BackgroundImageCardComponent implements OnInit {
	@Input({ required: true }) src = '';
	@Input() isPageTitle = false; // uses <h1> for the title if true. otherwise uses <h2>
	@Input() title = '';
	@Input() desc = '';

	public showTitle = true;
	public showDescription = true;

	ngOnInit(): void {
		if (this.title === '') {
			this.showTitle = false;
		}

		if (this.desc === '') {
			this.showDescription = false;
		}
	}
}
