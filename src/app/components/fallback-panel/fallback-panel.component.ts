import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
	Component,
	DestroyRef,
	ElementRef,
	afterNextRender,
	effect,
	inject,
	input,
	output,
	viewChild
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FocusRecoveryService } from 'src/app/layout/page-template/focus-recovery.service';

export const RETRY_FAILED_MESSAGE =
	"Still couldn't load. Try again in a moment.";

/**
 * Full-width failure screen: a pixel sad face, a heading, the projected
 * message, and one action. With `actionLink` the action is a link (e.g. home
 * from the 404 page); otherwise it's a button that emits `action` (e.g. retry).
 *
 * Keyboard focus: if focus was in the content this replaced, it moves to the
 * heading; when this goes away (e.g. a retry worked), lost focus moves to
 * <main>.
 */
@Component({
	selector: 'app-fallback-panel',
	imports: [RouterLink],
	templateUrl: './fallback-panel.component.html',
	styleUrl: './fallback-panel.component.scss'
})
export class FallbackPanelComponent {
	public readonly heading = input.required<string>();
	/** 1 when the panel is the whole page; 2 under a page's own <h1>. */
	public readonly headingLevel = input<1 | 2>(2);
	public readonly actionLabel = input('Try again');
	public readonly actionLink = input<string>();
	/** Shows the button as working (e.g. while retrying) and ignores clicks. */
	public readonly busy = input(false);

	public readonly action = output<void>();

	private readonly headingElement =
		viewChild.required<ElementRef<HTMLElement>>('headingElement');

	constructor() {
		const focusRecovery = inject(FocusRecoveryService);
		const announcer = inject(LiveAnnouncer);

		afterNextRender(() => {
			if (focusRecovery.wasFocusLost()) {
				this.headingElement().nativeElement.focus();
			}
		});
		inject(DestroyRef).onDestroy(() => focusRecovery.recoverAfterRender());

		// The alert was read when this appeared; a failed retry only changes
		// the button back, so say so.
		let wasBusy = false;
		effect(() => {
			const busy = this.busy();
			if (wasBusy && !busy) {
				void announcer.announce(RETRY_FAILED_MESSAGE, 'assertive');
			}
			wasBusy = busy;
		});
	}

	protected onAction(): void {
		if (!this.busy()) {
			this.action.emit();
		}
	}
}
