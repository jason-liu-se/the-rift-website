import { Component, Input, OnInit } from '@angular/core';
import { GalleryImage } from 'src/app/interfaces/api-responses';
import { MatIcon } from '@angular/material/icon';

@Component({
	selector: 'app-image-slideshow',
	templateUrl: './image-slideshow.component.html',
	styleUrls: ['./image-slideshow.component.scss'],
	imports: [MatIcon]
})
export class ImageSlideshowComponent implements OnInit {
	@Input({ required: true }) public captionedImages!: GalleryImage[];
	@Input() public startingIndex = 0;

	public index = 0;

	public isPrevDisabled = false;
	public isNextDisabled = false;

	ngOnInit(): void {
		this.index = this.startingIndex;

		// defaulting values for an empty captionedImages array
		if (this.captionedImages.length <= 0) {
			this.captionedImages = [{ url: '', caption: '' }];
		}

		// updating button states
		if (this.index <= 0) {
			this.isPrevDisabled = true;
		}

		if (this.index >= this.captionedImages.length - 1) {
			this.isNextDisabled = true;
		}
	}

	public handleClickPrev(): void {
		this.index--;

		if (this.index <= 0) {
			this.index = 0;
			this.isPrevDisabled = true;
		}

		if (this.index < this.captionedImages.length - 1) {
			this.isNextDisabled = false;
		}
	}

	public handleClickNext(): void {
		this.index++;

		if (this.index >= this.captionedImages.length - 1) {
			this.index = this.captionedImages.length - 1;
			this.isNextDisabled = true;
		}

		if (this.index > 0) {
			this.isPrevDisabled = false;
		}
	}
}
