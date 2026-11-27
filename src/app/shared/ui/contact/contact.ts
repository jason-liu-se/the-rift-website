import { Component } from '@angular/core';
import { CONTACT_EMAIL } from '../../../core/config/site';

@Component({
	selector: 'app-contact',
	templateUrl: './contact.html',
	styleUrls: ['./contact.scss']
})
export class Contact {
	public readonly contactEmail = CONTACT_EMAIL;
}
