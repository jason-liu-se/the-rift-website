import { Component, Input, OnInit } from '@angular/core';

@Component({
	selector: 'app-background-image-card',
	templateUrl: './background-image-card.component.html',
	styleUrls: ['./background-image-card.component.scss']
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
