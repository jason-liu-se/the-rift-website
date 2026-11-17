import { Component, afterNextRender, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';
import { BackButtonComponent } from '../../components/back-button/back-button.component';
import { MessageCardComponent } from './components/message-card/message-card.component';
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

	/** Set in the browser only: the server never receives the URL fragment. */
	public bluemapUrl = signal<string | null>(null);

	public showHAMsg = true; // HA = Hardware Acceleration
	public showControlMsg = true;

	constructor() {
		// Our fragment is BlueMap's own (map id, camera, view), passed through.
		afterNextRender(() => {
			const fragment = this.route.snapshot.fragment;
			this.bluemapUrl.set(
				`${environment.BLUEMAP_URL}/${fragment ? `#${fragment}` : ''}`
			);
		});
	}

	public toggleHAMsg(): void {
		this.showHAMsg = !this.showHAMsg;
	}

	public toggleControlMsg(): void {
		this.showControlMsg = !this.showControlMsg;
	}
}
