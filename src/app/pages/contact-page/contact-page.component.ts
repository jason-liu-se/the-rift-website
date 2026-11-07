import { Component } from '@angular/core';
import { BackgroundImageCardComponent } from '../../components/background-image-card/background-image-card.component';
import { ContactComponent } from '../../components/contact/contact.component';

@Component({
	selector: 'app-contact-page',
	templateUrl: './contact-page.component.html',
	styleUrls: ['./contact-page.component.scss'],
	imports: [BackgroundImageCardComponent, ContactComponent]
})
export class ContactPageComponent {}
