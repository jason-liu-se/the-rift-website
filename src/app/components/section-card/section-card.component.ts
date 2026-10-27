import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-section-card',
    templateUrl: './section-card.component.html',
    styleUrls: ['./section-card.component.scss'],
    standalone: false
})
export class SectionCardComponent implements OnInit {
    // optional properties
    @Input() public title: string = '';
    @Input() public content: string = '';
    @Input('img') public imageUrl: string = '';
    @Input() public backgroundType!: string; // can be 'none', 'dark', or 'light' - default is 'light'
    @Input() public titlePosition!: string; // can be 'left', 'right', or 'center' - default is 'left'
    @Input() public contentPosition!: string; // can be 'left', 'right', or 'center' - default is 'left'
    @Input('imgPos') public imagePosition!: string; // can be 'left', 'right', 'top', or 'bottom' - default is 'left'
    @Input('paddingX') public sectionPaddingX: boolean = true;
    @Input('paddingY') public sectionPaddingY: boolean = true;

    public titlePositionClass!: string;
    public backgroundTypeClass!: string;
    public imagePositionClass!: string;
    public contentPositionClass!: string;
    public showTitle: boolean = true;
    public showContent: boolean = true;
    public showImage: boolean = true;

    ngOnInit(): void {
        // parsing title position information
        switch (this.titlePosition) {
            case 'right':
                this.titlePositionClass = 'right-align';
                break;
            case 'center':
                this.titlePositionClass = 'center-align';
                break;
            default:
                this.titlePositionClass = 'left-align';
        }

        // parsing background type information
        switch (this.backgroundType) {
            case 'none':
                this.backgroundTypeClass = 'empty-background';
                break;
            case 'dark':
                this.backgroundTypeClass = 'dark-background';
                break;
            default:
                this.backgroundTypeClass = 'light-background';
        }

        // parsing the image location
        switch (this.imagePosition) {
            case 'right':
                this.imagePositionClass = 'right-align-image';
                break;
            case 'top':
                this.imagePositionClass = 'top-align-image';
                break;
            case 'bottom':
                this.imagePositionClass = 'bottom-align-image';
                break;
            default:
                this.imagePositionClass = 'left-align-image';
        }

        // parsing the content location
        switch (this.contentPosition) {
            case 'right':
                this.contentPositionClass = 'right-align';
                break;
            case 'center':
                this.contentPositionClass = 'center-align';
                break;
            default:
                this.contentPositionClass = 'left-align';
        }

        // parsing content information
        if (this.title === '') {
            this.showTitle = false;
        }

        if (this.content === '') {
            this.showContent = false;
        }

        if (this.imageUrl === '') {
            this.showImage = false;
        }
    }
}
