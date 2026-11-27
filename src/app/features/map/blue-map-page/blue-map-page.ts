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
import { BackButton } from '../../../shared/ui/back-button/back-button';
import { MessageCard } from './message-card/message-card';
import { MatIcon } from '@angular/material/icon';

const BLUEMAP_ORIGIN = new URL(environment.BLUEMAP_URL).origin;
/** Sent by BlueMap's url-sync.js (bluemap/ in this repo) when its fragment changes. */
const BLUEMAP_HASH_MESSAGE = 'bluemap:hash';
/** Marks our navigations that copy BlueMap's fragment into our URL. */
const FROM_BLUEMAP = 'from-bluemap';

/** The map id at the start of a BlueMap fragment (`s6_nether:0:0:...`). */
function mapIdOf(fragment: string | null): string | undefined {
	return fragment?.split(':')[0];
}

@Component({
	selector: 'app-blue-map-page',
	templateUrl: './blue-map-page.html',
	styleUrls: ['./blue-map-page.scss'],
	imports: [BackButton, MessageCard, MatIcon],
	host: { '(window:message)': 'onWindowMessage($event)' }
})
export class BlueMapPage {
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
	/** The map BlueMap last reported showing; unset until its first report. */
	private shownMapId?: string;
	/** The fragment last sent to BlueMap, which url-sync.js echoes straight back. */
	private sentFragment: string | null = null;

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

		// location.replace, not src: setting src adds a hidden Back/Forward entry
		// for the iframe, and a [src] binding skips a value equal to the last one.
		effect(() => {
			const fragment = this.requestedFragment();
			const blueMapWindow = this.iframe()?.nativeElement.contentWindow;
			if (!blueMapWindow) {
				return;
			}
			this.sentFragment = fragment;
			blueMapWindow.location.replace(
				`${environment.BLUEMAP_URL}/${fragment ? `#${fragment}` : ''}`
			);
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

		// Only switching to another map earns a Back/Forward entry; camera and
		// perspective changes replace it. A map that matches our URL is BlueMap
		// showing what it was sent, and one it already showed is BlueMap swapping
		// an unknown map for its default again: pushing either would trap Back.
		const mapId = mapIdOf(data.hash);
		const isMapSwitch =
			this.shownMapId !== undefined &&
			mapId !== this.shownMapId &&
			mapId !== mapIdOf(this.route.snapshot.fragment);
		// An echo of what we sent isn't what BlueMap shows (it may not know that map).
		const isEcho = data.hash === this.sentFragment;
		if (!isEcho || this.shownMapId === undefined) {
			this.shownMapId = mapId;
		}

		this.router.navigate([], {
			relativeTo: this.route,
			fragment: data.hash,
			queryParamsHandling: 'preserve',
			replaceUrl: !isMapSwitch,
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
