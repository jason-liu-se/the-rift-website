import {
	Component,
	afterNextRender,
	computed,
	inject,
	signal
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
	/** Our fragment is BlueMap's own (map id, camera, view), passed through. */
	private fragment = toSignal(inject(ActivatedRoute).fragment, {
		initialValue: null
	});
	/** The server never receives the URL fragment, so only the browser shows the map. */
	private isRendered = signal(false);

	/** Follows the fragment, so editing it in the address bar moves the map. */
	public bluemapUrl = computed(() => {
		if (!this.isRendered()) {
			return null;
		}
		const fragment = this.fragment();
		return `${environment.BLUEMAP_URL}/${fragment ? `#${fragment}` : ''}`;
	});

	public showHAMsg = true; // HA = Hardware Acceleration
	public showControlMsg = true;

	constructor() {
		afterNextRender(() => this.isRendered.set(true));
	}

	public toggleHAMsg(): void {
		this.showHAMsg = !this.showHAMsg;
	}

	public toggleControlMsg(): void {
		this.showControlMsg = !this.showControlMsg;
	}
}
