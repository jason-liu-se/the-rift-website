import { Component, Input, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { OptimizedImageComponent } from 'src/app/components/optimized-image/optimized-image.component';

@Component({
	selector: 'app-download-card',
	templateUrl: './download-card.component.html',
	styleUrls: ['./download-card.component.scss'],
	imports: [MatButton, MatIcon, OptimizedImageComponent]
})
export class DownloadCardComponent implements OnInit {
	@Input() public title = '';
	@Input() public desc = '';
	@Input({ required: true }) public src!: string;
	@Input() public imgSrc = '';

	public showTitle = false;
	public showDesc = false;

	ngOnInit(): void {
		if (this.title !== '') {
			this.showTitle = true;
		}

		if (this.desc !== '') {
			this.showDesc = true;
		}
	}
}
