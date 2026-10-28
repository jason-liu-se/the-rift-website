import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-back-button',
    templateUrl: './back-button.component.html',
    styleUrls: ['./back-button.component.scss'],
    standalone: false
})
export class BackButtonComponent {
    @Input({ alias: 'destination', required: true }) public link!: string;
    @Input({ required: true }) public title!: string;
}
