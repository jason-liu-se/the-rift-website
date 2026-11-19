import { Component, Input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { OPTIMIZED_IMAGE } from 'src/app/directives/image-fallback.directive';

@Component({
	selector: 'app-welcome-card',
	templateUrl: './welcome-card.component.html',
	styleUrls: ['./welcome-card.component.scss'],
	imports: [MatIcon, OPTIMIZED_IMAGE]
})
export class WelcomeCardComponent {
	@Input() public desc = '';
	@Input() public backgroundUrl: string | null = '';
	@Input() public headerUrl = '';
	@Input() public headerAlt = '';
}
