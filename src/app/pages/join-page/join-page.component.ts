import { Component } from '@angular/core';
import { BackgroundImageCardComponent } from '../../components/background-image-card/background-image-card.component';
import { SectionCardComponent } from '../../components/section-card/section-card.component';
import { MatFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { JOIN_FORM_URL } from '../../config/site';

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
