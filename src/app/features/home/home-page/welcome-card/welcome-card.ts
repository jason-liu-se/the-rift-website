import { Component, Input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { OptimizedImage } from 'src/app/shared/ui/optimized-image/optimized-image';

@Component({
	selector: 'app-welcome-card',
	templateUrl: './welcome-card.html',
	styleUrls: ['./welcome-card.scss'],
	imports: [MatIcon, OptimizedImage]
})
export class WelcomeCard {
	@Input() public desc = '';
	@Input() public backgroundUrl: string | null = '';
	@Input() public headerUrl = '';
	@Input() public headerAlt = '';
}
