import { Component, Input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { EditButtonComponent } from 'src/app/components/edit-button/edit-button.component';
import { OptimizedImageComponent } from 'src/app/components/optimized-image/optimized-image.component';

@Component({
	selector: 'app-download-card',
	templateUrl: './download-card.component.html',
	styleUrls: ['./download-card.component.scss'],
	imports: [EditButtonComponent, MatButton, MatIcon, OptimizedImageComponent]
})
export class DownloadCardComponent {
	@Input() public title = '';
	@Input() public desc = '';
	@Input({ required: true }) public src!: string;
	@Input() public imgSrc = '';
	/** The item's ID, to offer editors an Edit link (not on previews). */
	@Input() public editId?: string;
}
