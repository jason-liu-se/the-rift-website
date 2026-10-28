import { Component, Input, OnInit } from '@angular/core';
import { ICaptionCard } from 'src/app/interfaces/slideshow-image.interface';

@Component({
    selector: 'app-image-slideshow',
    templateUrl: './image-slideshow.component.html',
    styleUrls: ['./image-slideshow.component.scss'],
    standalone: false
})
export class ImageSlideshowComponent implements OnInit {
    @Input({ required: true }) public captionedImages!: ICaptionCard[];
    @Input('startingIndex') public index: number = 0;

    public isPrevDisabled: boolean = false;
    public isNextDisabled: boolean = false;

    ngOnInit(): void {
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
