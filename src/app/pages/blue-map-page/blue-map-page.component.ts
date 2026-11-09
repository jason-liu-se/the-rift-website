import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';
import { BackButtonComponent } from '../../components/back-button/back-button.component';
import { MessageCardComponent } from '../../components/message-card/message-card.component';
import { MatIcon } from '@angular/material/icon';
import { SafePipe } from '../../utilities/SafePipe.util';

/** BlueMap URL hash suffix after the map id: the initial camera position and view. */
const BLUEMAP_CAMERA_HASH = ':0:0:0:1500:0:0:0:0:perspective';

@Component({
	selector: 'app-blue-map-page',
	templateUrl: './blue-map-page.component.html',
	styleUrls: ['./blue-map-page.component.scss'],
	imports: [BackButtonComponent, MessageCardComponent, MatIcon, SafePipe]
})
export class BlueMapPageComponent {
	private route = inject(ActivatedRoute);

	public bluemapUrl: string;

	public showHAMsg = true; // HA = Hardware Acceleration
	public showControlMsg = true;

	constructor() {
		const mapName = this.route.snapshot.data['mapName'] ?? '';
		this.bluemapUrl = `${environment.bluemapUrl}/#${mapName}${BLUEMAP_CAMERA_HASH}`;
	}

	public toggleHAMsg(): void {
		this.showHAMsg = !this.showHAMsg;
	}

	public toggleControlMsg(): void {
		this.showControlMsg = !this.showControlMsg;
	}
}
