import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-welcome-card',
    templateUrl: './welcome-card.component.html',
    styleUrls: ['./welcome-card.component.scss'],
    standalone: false
})
export class WelcomeCardComponent {
    @Input('desc') public description: string = '';
    @Input() public backgroundUrl: string | null = '';
    @Input() public headerUrl: string = '';
}
