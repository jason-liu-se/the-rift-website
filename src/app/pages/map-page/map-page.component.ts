import { Component, OnInit } from '@angular/core';
import { ICardSelection } from 'src/app/interfaces/card-selection.interface';

@Component({
    selector: 'app-page-map',
    templateUrl: './map-page.component.html',
    styleUrls: ['./map-page.component.scss'],
    standalone: false
})
export class MapPageComponent implements OnInit {
    public mapItems: ICardSelection[] = [
        {
            imageUrl:
                '../../../assets/general-background-images/season-5-circle.png',
            routerLink: '/map/season-5-overworld',
            title: 'Season 5',
            desc: 'Overworld'
        },
        {
            imageUrl:
                '../../../assets/general-background-images/season-5-circle.png',
            routerLink: '/map/season-5-nether',
            title: 'Season 5',
            desc: 'Nether'
        },
        {
            imageUrl:
                '../../../assets/general-background-images/season-5-circle.png',
            routerLink: '/map/season-5-end',
            title: 'Season 5',
            desc: 'End'
        }
    ];

    public ngOnInit(): void {}
}
