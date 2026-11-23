import { Component, Input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { OptimizedImageComponent } from 'src/app/components/optimized-image/optimized-image.component';

@Component({
	selector: 'app-download-card',
	templateUrl: './download-card.component.html',
	styleUrls: ['./download-card.component.scss'],
	imports: [MatButton, MatIcon, OptimizedImageComponent]
})
export class DownloadCardComponent {
	@Input() public title = '';
	@Input() public desc = '';
	@Input({ required: true }) public src!: string;
	@Input() public imgSrc = '';
}
