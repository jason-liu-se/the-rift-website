import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, computed, inject } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { publishHeight } from '../publish-height';
import { StatusBannerKind, StatusBannerService } from './status-banner.service';

/** CSS variable the navbar and `scroll-padding-top` offset themselves by. */
export const STATUS_BANNER_HEIGHT_VARIABLE = '--status-banner-height';

const MESSAGES: Record<StatusBannerKind, string> = {
	down: "The Rift's services are down.",
	offline: "You're offline.",
	recovered: 'Back online'
};

/** Editors are also told why their changes won't save. */
const EDITOR_DOWN_MESSAGE =
	"The Rift's services are down. Changes can't be saved right now.";

/** Tells every visitor when the API is down, they're offline, or it's back. */
@Component({
	selector: 'app-status-banner',
	templateUrl: './status-banner.component.html',
	styleUrls: ['./status-banner.component.scss']
})
export class StatusBannerComponent {
	private readonly banner = inject(StatusBannerService);
	private readonly document = inject(DOCUMENT);
	private readonly user = inject(AuthService).user;

	public readonly kind = this.banner.kind;
	public readonly message = computed(() => {
		const kind = this.kind();
		if (kind === 'down' && this.user()) {
			return EDITOR_DOWN_MESSAGE;
		}
		return kind ? MESSAGES[kind] : null;
	});

	constructor() {
		const host = inject<ElementRef<HTMLElement>>(ElementRef);
		publishHeight(STATUS_BANNER_HEIGHT_VARIABLE, () => host.nativeElement);
	}

	public dismiss(): void {
		this.banner.dismiss();
		// The button is about to go; keep focus in the page, not on <body>.
		this.document
			.querySelector<HTMLElement>('main')
			?.focus({ preventScroll: true });
	}
}
