import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'app-caption-card',
    templateUrl: './caption-card.component.html',
    styleUrls: ['./caption-card.component.scss'],
    standalone: false
})
export class CaptionCardComponent implements OnInit {
    @Input({ alias: 'src', required: true }) public imageUrl!: string;
    @Input('alt') public altDesc: string = '';
    @Input() public caption: string = '';
    @Input('caption-visibility') visibility!: string; // visible, hidden, hover. Default = visible

    public visibilityType!: string;

    ngOnInit(): void {
        switch (this.visibility) {
            case 'hidden':
                this.visibilityType = 'hidden';
                break;
            case 'hover':
                this.visibilityType = 'hover';
                break;
            default:
                this.visibilityType = 'visible';
        }
    }
}
