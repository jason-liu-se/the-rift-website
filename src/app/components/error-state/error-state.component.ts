import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Full-width failure screen: a cracked block, a heading, the projected
 * message, and one action. With `actionLink` the action is a link (e.g. home
 * from the 404 page); otherwise it's a button that emits `action` (e.g. retry).
 */
@Component({
	selector: 'app-error-state',
	imports: [RouterLink],
	templateUrl: './error-state.component.html',
	styleUrl: './error-state.component.scss',
	// A failure that replaces content is announced; a 404 page is just a page.
	host: { '[attr.role]': 'actionLink() ? null : "alert"' }
})
export class ErrorStateComponent {
	public readonly heading = input.required<string>();
	/** 1 when the error state is the whole page; 2 under a page's own <h1>. */
	public readonly headingLevel = input<1 | 2>(2);
	public readonly actionLabel = input('Try again');
	public readonly actionLink = input<string>();
	/** Shows the button as working (e.g. while retrying) and ignores clicks. */
	public readonly busy = input(false);

	public readonly action = output<void>();

	protected onAction(): void {
		if (!this.busy()) {
			this.action.emit();
		}
	}
}
