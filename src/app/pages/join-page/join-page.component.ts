import { Component } from '@angular/core';
import { BackgroundImageCardComponent } from '../../components/background-image-card/background-image-card.component';
import { SectionCardComponent } from '../../components/section-card/section-card.component';
import { MatFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

/** Google Form that applicants fill out to join the server. */
export const JOIN_FORM_URL = 'https://exampleform.com';

@Component({
	selector: 'app-join-page',
	templateUrl: './join-page.component.html',
	styleUrls: ['./join-page.component.scss'],
	imports: [
		BackgroundImageCardComponent,
		SectionCardComponent,
		MatFabButton,
		MatIcon
	]
})
export class JoinPageComponent {
	public readonly joinFormUrl = JOIN_FORM_URL;
}
