import { Component } from '@angular/core';
import { LOGO_PATH } from '../../config/site';

@Component({
	selector: 'app-footer',
	templateUrl: './footer.component.html',
	styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
	public readonly logoPath = LOGO_PATH;
}
