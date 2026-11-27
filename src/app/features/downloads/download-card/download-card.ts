import { Component, Input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { EditButton } from 'src/app/shared/ui/edit-button/edit-button';
import { OptimizedImage } from 'src/app/shared/ui/optimized-image/optimized-image';

@Component({
	selector: 'app-download-card',
	templateUrl: './download-card.html',
	styleUrls: ['./download-card.scss'],
	imports: [EditButton, MatButton, MatIcon, OptimizedImage]
})
export class DownloadCard {
	@Input() public title = '';
	@Input() public desc = '';
	@Input({ required: true }) public src!: string;
	@Input() public imgSrc = '';
	/** The item's ID, to offer editors an Edit link (not on previews). */
	@Input() public editId?: string;
}
