import { Component } from '@angular/core';
import { LOGO_PATH } from '../../config/site';

@Component({
	selector: 'app-footer',
	templateUrl: './footer.html',
	styleUrls: ['./footer.scss']
})
export class Footer {
	public readonly logoPath = LOGO_PATH;
}
