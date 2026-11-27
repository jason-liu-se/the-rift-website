import { Component, Input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { OptimizedImageComponent } from 'src/app/shared/ui/optimized-image/optimized-image.component';

@Component({
	selector: 'app-welcome-card',
	templateUrl: './welcome-card.component.html',
	styleUrls: ['./welcome-card.component.scss'],
	imports: [MatIcon, OptimizedImageComponent]
})
export class WelcomeCardComponent {
	@Input() public desc = '';
	@Input() public backgroundUrl: string | null = '';
	@Input() public headerUrl = '';
	@Input() public headerAlt = '';
}
