import { Component } from '@angular/core';
import { BackgroundImageCard } from '../../../shared/ui/background-image-card/background-image-card';
import { SectionCard } from '../../../shared/ui/section-card/section-card';

@Component({
	selector: 'app-page-about',
	templateUrl: './about-page.html',
	styleUrls: ['./about-page.scss'],
	imports: [BackgroundImageCard, SectionCard]
})
export class AboutPage {}
