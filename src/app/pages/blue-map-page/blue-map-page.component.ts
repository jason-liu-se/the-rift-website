import { Component, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Constants } from 'src/app/config/constants';

@Component({
    selector: 'app-blue-map-page',
    templateUrl: './blue-map-page.component.html',
    styleUrls: ['./blue-map-page.component.scss'],
    standalone: false
})
export class BlueMapPageComponent {
    public bluemapUrl: string;
    public serverUrl: string;

    public showHAMsg: boolean = true; // HA = Hardware Acceleration
    public showControlMsg: boolean = true;

    private constants: Constants = new Constants();

    constructor(private route: ActivatedRoute) {
        const mapNameProp = this.route.snapshot.data['mapName'];
        const mapName = mapNameProp == null ? '' : mapNameProp;

        this.bluemapUrl =
            this.constants.BLUEMAP_URL +
            '/#' +
            mapName +
            this.constants.BLUEMAP_POSTFIX;
        this.serverUrl = this.constants.API_ENDPOINT;
    }

    public toggleHAMsg(): void {
        this.showHAMsg = !this.showHAMsg;
    }

    public toggleControlMsg(): void {
        this.showControlMsg = !this.showControlMsg;
    }
}
