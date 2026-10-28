import { Component, Input, Output } from '@angular/core';

@Component({
    selector: 'app-message-card',
    templateUrl: './message-card.component.html',
    styleUrls: ['./message-card.component.scss'],
    standalone: false
})
export class MessageCardComponent {
    @Input() public title: string = '';
    @Input() public message: string = '';
    @Input() public messageColor: string = 'black';
    @Input() public backgroundColor: string = 'transparent';
    @Input() public borderColor: string = 'transparent';
    @Input() public width: string = '100%';
    @Input() public height: string = '100%';
}
