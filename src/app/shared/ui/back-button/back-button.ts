import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
	selector: 'app-back-button',
	templateUrl: './back-button.html',
	styleUrls: ['./back-button.scss'],
	imports: [RouterLink]
})
export class BackButton {
	@Input({ required: true }) public destination!: string;
	@Input({ required: true }) public title!: string;
}
