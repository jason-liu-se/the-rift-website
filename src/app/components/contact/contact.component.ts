import { Component } from '@angular/core';
import { CONTACT_EMAIL } from '../../config/site';

@Component({
	selector: 'app-contact',
	templateUrl: './contact.component.html',
	styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
	public readonly contactEmail = CONTACT_EMAIL;
}
