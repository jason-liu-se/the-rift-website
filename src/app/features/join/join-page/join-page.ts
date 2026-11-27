import { Component } from '@angular/core';
import { BackgroundImageCard } from '../../../shared/ui/background-image-card/background-image-card';
import { SectionCard } from '../../../shared/ui/section-card/section-card';
import { MatFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { JOIN_FORM_URL } from '../../../core/config/site';

@Component({
	selector: 'app-join-page',
	templateUrl: './join-page.html',
	styleUrls: ['./join-page.scss'],
	imports: [BackgroundImageCard, SectionCard, MatFabButton, MatIcon]
})
export class JoinPage {
	public readonly joinFormUrl = JOIN_FORM_URL;
}
