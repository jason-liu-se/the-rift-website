import { Component, Input, OnInit } from '@angular/core';
import { OptimizedImage } from 'src/app/shared/ui/optimized-image/optimized-image';

@Component({
	selector: 'app-background-image-card',
	templateUrl: './background-image-card.html',
	styleUrls: ['./background-image-card.scss'],
	imports: [OptimizedImage]
})
export class BackgroundImageCard implements OnInit {
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
