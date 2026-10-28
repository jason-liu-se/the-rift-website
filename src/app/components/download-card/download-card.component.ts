import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-download-card',
    templateUrl: './download-card.component.html',
    styleUrls: ['./download-card.component.scss'],
    standalone: false
})
export class DownloadCardComponent implements OnInit {
    @Input() public title: string = '';
    @Input() public desc: string = '';
    @Input({ alias: 'src', required: true }) public downloadUrl!: string;
    @Input('imgSrc') public backgroundImgSrc: string = '';

    public showTitle: boolean = false;
    public showDesc: boolean = false;

    ngOnInit(): void {
        if (this.title !== '') {
            this.showTitle = true;
        }

        if (this.desc !== '') {
            this.showDesc = true;
        }

        // preparing the image URL for CSS styling
        this.backgroundImgSrc = 'url(' + this.backgroundImgSrc + ')';
    }
}
