import { Component, Input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
	selector: 'app-welcome-card',
	templateUrl: './welcome-card.component.html',
	styleUrls: ['./welcome-card.component.scss'],
	imports: [MatIcon]
})
export class WelcomeCardComponent {
	@Input() public desc = '';
	@Input() public backgroundUrl: string | null = '';
	@Input() public headerUrl = '';
	@Input() public headerAlt = '';
}
