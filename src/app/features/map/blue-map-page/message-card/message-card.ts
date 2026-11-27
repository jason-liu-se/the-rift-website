import { Component, Input } from '@angular/core';

@Component({
	selector: 'app-message-card',
	templateUrl: './message-card.html',
	styleUrls: ['./message-card.scss']
})
export class MessageCard {
	@Input() public title = '';
	@Input() public message = '';
	@Input() public messageColor = 'black';
	@Input() public backgroundColor = 'transparent';
	@Input() public borderColor = 'transparent';
	@Input() public width = '100%';
	@Input() public height = '100%';
}
