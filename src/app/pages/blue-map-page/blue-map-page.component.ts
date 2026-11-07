import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Constants } from 'src/app/config/constants';
import { BackButtonComponent } from '../../components/back-button/back-button.component';
import { MessageCardComponent } from '../../components/message-card/message-card.component';
import { MatIcon } from '@angular/material/icon';
import { SafePipe } from '../../utilities/SafePipe.util';

@Component({
	selector: 'app-blue-map-page',
	templateUrl: './blue-map-page.component.html',
	styleUrls: ['./blue-map-page.component.scss'],
	imports: [BackButtonComponent, MessageCardComponent, MatIcon, SafePipe]
})
export class BlueMapPageComponent {
	private route = inject(ActivatedRoute);

	public bluemapUrl: string;
	public serverUrl: string;

	public showHAMsg = true; // HA = Hardware Acceleration
	public showControlMsg = true;

	private constants: Constants = new Constants();

	constructor() {
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
