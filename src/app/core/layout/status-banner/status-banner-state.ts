import {
	Injectable,
	computed,
	effect,
	inject,
	signal,
	untracked
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
import { ApiStatusMonitor } from '../../api/api-status/api-status-monitor';

export type StatusBannerKind = 'down' | 'offline' | 'recovered';

/**
 * What the status banner shows. Lives in the root, not in the banner: every
 * route renders its own page template (and banner), so a dismissal or a
 * "Back online" message has to outlive navigations.
 */
@Injectable({
	providedIn: 'root'
})
export class StatusBannerState {
	private readonly router = inject(Router);
	private readonly apiStatus = inject(ApiStatusMonitor).status;

	private readonly dismissedOutage = signal(false);
	private readonly recovered = signal(false);
	private navigatedDuringOutage = false;

	/** The message to show, or null while there is nothing to say. */
	public readonly kind = computed<StatusBannerKind | null>(() => {
		const status = this.apiStatus();
		if (status === 'up') {
			return this.recovered() ? 'recovered' : null;
		}
		return this.dismissedOutage() ? null : status;
	});

	constructor() {
		let previous = this.apiStatus();
		effect(() => {
			const current = this.apiStatus();
			untracked(() => {
				if (previous === 'up' && current !== 'up') {
					this.dismissedOutage.set(false);
					this.recovered.set(false);
					this.navigatedDuringOutage = false;
				} else if (previous !== 'up' && current === 'up') {
					this.recovered.set(
						!this.dismissedOutage() && !this.navigatedDuringOutage
					);
				}
				previous = current;
			});
		});

		// Counted when it starts: the API may recover before it ends. The first
		// page load isn't a navigation away from anything.
		this.router.events
			.pipe(
				// `navigated` is false only during the first page load, however
				// late this service is created within it.
				filter(
					(event) =>
						event instanceof NavigationStart &&
						this.router.navigated
				),
				takeUntilDestroyed()
			)
			.subscribe(() => {
				this.recovered.set(false);
				this.navigatedDuringOutage ||= this.apiStatus() !== 'up';
			});
	}

	/** Hides the message: for the whole outage, or the "Back online" message. */
	public dismiss(): void {
		if (this.apiStatus() === 'up') {
			this.recovered.set(false);
		} else {
			this.dismissedOutage.set(true);
		}
	}
}
