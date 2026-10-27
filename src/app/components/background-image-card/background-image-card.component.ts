import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-background-image-card',
    templateUrl: './background-image-card.component.html',
    styleUrls: ['./background-image-card.component.scss'],
    standalone: false
})
export class BackgroundImageCardComponent implements OnInit {
    @Input({ alias: 'src', required: true }) backgroundImgSrc: string = '';
    @Input('isPageTitle') isPageTitle: boolean = false; // uses <h1> for the title if true. otherwise uses <h2>
    @Input('title') title: string = '';
    @Input('desc') description: string = '';

    public showTitle: boolean = true;
    public showDescription: boolean = true;

    ngOnInit(): void {
        if (this.title === '') {
            this.showTitle = false;
        }

        if (this.description === '') {
            this.showDescription = false;
        }
    }
}
