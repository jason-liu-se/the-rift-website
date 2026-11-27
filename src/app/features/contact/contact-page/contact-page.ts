import { Component } from '@angular/core';
import { BackgroundImageCard } from '../../../shared/ui/background-image-card/background-image-card';
import { Contact } from '../../../shared/ui/contact/contact';

@Component({
	selector: 'app-contact-page',
	templateUrl: './contact-page.html',
	styleUrls: ['./contact-page.scss'],
	imports: [BackgroundImageCard, Contact]
})
export class ContactPage {}
