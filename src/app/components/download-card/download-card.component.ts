import { Component, Input, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
	selector: 'app-download-card',
	templateUrl: './download-card.component.html',
	styleUrls: ['./download-card.component.scss'],
	imports: [MatButton, MatIcon]
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

		// preparing the image URL for CSS styling
		this.imgSrc = 'url(' + this.imgSrc + ')';
	}
}
