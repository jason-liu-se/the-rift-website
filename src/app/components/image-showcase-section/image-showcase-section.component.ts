import { Component, Input } from '@angular/core';
import { ICaptionCard } from 'src/app/interfaces/slideshow-image.interface';

@Component({
    selector: 'app-image-showcase-section',
    templateUrl: './image-showcase-section.component.html',
    styleUrls: ['./image-showcase-section.component.scss'],
    standalone: false
})
export class ImageShowcaseSectionComponent {
    @Input({ required: true })
    public captionedImages!: ICaptionCard[];

    public imageIndex: number = 0;
    public isPopUpVisible: boolean = false;

    public handleImageClick(imageButton: Element): void {
        const imageIndex: string | null = imageButton.getAttribute('index');

        this.imageIndex = imageIndex ? (imageIndex as unknown as number) : 0;
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
