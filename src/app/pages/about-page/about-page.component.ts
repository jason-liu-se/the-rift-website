import { Component } from '@angular/core';
import { BackgroundImageCardComponent } from '../../components/background-image-card/background-image-card.component';
import { SectionCardComponent } from '../../components/section-card/section-card.component';

@Component({
	selector: 'app-page-about',
	templateUrl: './about-page.component.html',
	styleUrls: ['./about-page.component.scss'],
	imports: [BackgroundImageCardComponent, SectionCardComponent]
})
export class AboutPageComponent {}
