import { Component, Input } from '@angular/core';
import { ICaptionCard } from 'src/app/interfaces/slideshow-image.interface';
import { CaptionCardComponent } from '../caption-card/caption-card.component';
import { ImageSlideshowComponent } from '../image-slideshow/image-slideshow.component';
import { MatFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
	selector: 'app-image-showcase-section',
	templateUrl: './image-showcase-section.component.html',
	styleUrls: ['./image-showcase-section.component.scss'],
	imports: [
		CaptionCardComponent,
		ImageSlideshowComponent,
		MatFabButton,
		MatIcon
	]
})
export class ImageShowcaseSectionComponent {
	@Input({ required: true })
	public captionedImages!: ICaptionCard[];

	public imageIndex = 0;
	public isPopUpVisible = false;

	public handleImageClick(imageIndex: number): void {
		this.imageIndex = imageIndex;
		this.isPopUpVisible = true;

		this.disablePageScrolling();
	}

	public handleClose(): void {
		this.isPopUpVisible = false;

		this.enablePageScrolling();
	}

	private disablePageScrolling(): void {
		// disabling scrolling if there is a scroll bar
		const body = document.body,
			html = document.documentElement;

		const height = Math.max(
			body.scrollHeight,
			body.offsetHeight,
			html.clientHeight,
			html.scrollHeight,
			html.offsetHeight
		);

		if (height > window.innerHeight) {
			const scrollTop = html.scrollTop ? html.scrollTop : body.scrollTop;
			html.classList.add('disable-scroll');
			html.style.top = -scrollTop + 'px';
		}
	}

	private enablePageScrolling() {
		const html = document.documentElement;
		const body = document.body;
		const scrollTop = parseInt(html.style.top);

		html.classList.remove('disable-scroll');
		html.scrollTop = -scrollTop;
		body.scrollTop = -scrollTop;
	}
}
