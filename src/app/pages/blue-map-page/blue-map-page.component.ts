import {
	Component,
	ElementRef,
	afterNextRender,
	effect,
	inject,
	signal,
	viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { filter } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BackButtonComponent } from '../../components/back-button/back-button.component';
import { MessageCardComponent } from './components/message-card/message-card.component';
import { MatIcon } from '@angular/material/icon';

const BLUEMAP_ORIGIN = new URL(environment.BLUEMAP_URL).origin;
/** Sent by BlueMap's url-sync.js (bluemap/ in this repo) when its fragment changes. */
const BLUEMAP_HASH_MESSAGE = 'bluemap:hash';
/** Marks our navigations that copy BlueMap's fragment into our URL. */
const FROM_BLUEMAP = 'from-bluemap';

@Component({
	selector: 'app-blue-map-page',
	templateUrl: './blue-map-page.component.html',
	styleUrls: ['./blue-map-page.component.scss'],
	imports: [BackButtonComponent, MessageCardComponent, MatIcon],
	host: { '(window:message)': 'onWindowMessage($event)' }
})
export class BlueMapPageComponent {
	private route = inject(ActivatedRoute);
	private router = inject(Router);
	private iframe = viewChild<ElementRef<HTMLIFrameElement>>('mapIframe');

	/**
	 * The view to send BlueMap: our fragment is BlueMap's own (map id, camera,
	 * view). Set from the page URL or the address bar, not from BlueMap itself,
	 * which is already there (and may have moved on since). Notifies even when
	 * unchanged, so returning to an earlier view moves the map back.
	 */
	private requestedFragment = signal<string | null>(null, {
		equal: () => false
	});
	/** The server never receives the URL fragment, so only the browser shows the map. */
	public isRendered = signal(false);

	public showHAMsg = true; // HA = Hardware Acceleration
	public showControlMsg = true;

	constructor() {
		this.route.fragment
			.pipe(
				filter(
					() =>
						this.router.currentNavigation()?.extras.info !==
						FROM_BLUEMAP
				),
				takeUntilDestroyed()
			)
			.subscribe((fragment) => this.requestedFragment.set(fragment));
		afterNextRender(() => this.isRendered.set(true));

		// Set directly, as a [src] binding skips a value equal to the last one.
		effect(() => {
			const fragment = this.requestedFragment();
			const iframe = this.iframe()?.nativeElement;
			if (iframe) {
				iframe.src = `${environment.BLUEMAP_URL}/${fragment ? `#${fragment}` : ''}`;
			}
		});
	}

	/** Copies BlueMap's fragment into our URL as the visitor moves around the map. */
	public onWindowMessage({ origin, source, data }: MessageEvent): void {
		const isFromOurBlueMap =
			origin === BLUEMAP_ORIGIN &&
			source === this.iframe()?.nativeElement.contentWindow;
		if (
			!isFromOurBlueMap ||
			data?.type !== BLUEMAP_HASH_MESSAGE ||
			typeof data.hash !== 'string' ||
			!data.hash
		) {
			return;
		}

		// Replaces the history entry, so Back leaves the map instead of retracing it.
		this.router.navigate([], {
			relativeTo: this.route,
			fragment: data.hash,
			queryParamsHandling: 'preserve',
			replaceUrl: true,
			info: FROM_BLUEMAP
		});
	}

	public toggleHAMsg(): void {
		this.showHAMsg = !this.showHAMsg;
	}

	public toggleControlMsg(): void {
		this.showControlMsg = !this.showControlMsg;
	}
}
