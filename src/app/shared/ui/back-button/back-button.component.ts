import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
	selector: 'app-back-button',
	templateUrl: './back-button.component.html',
	styleUrls: ['./back-button.component.scss'],
	imports: [RouterLink]
})
export class BackButtonComponent {
	@Input({ required: true }) public destination!: string;
	@Input({ required: true }) public title!: string;
}
