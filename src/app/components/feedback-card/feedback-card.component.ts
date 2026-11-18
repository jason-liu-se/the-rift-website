import { Component, computed, input } from '@angular/core';
import { FeedbackVariant, feedbackRole } from './feedback-variant';

/**
 * Inline feedback (a failed form submit, a warning, a success) with a title
 * and the projected message.
 *
 * It's a live region (`alert`, or `status` for success), and focusable by
 * script (`tabindex="-1"`). Callers do one or the other, not both: either
 * render it and let the role announce it, or focus it (e.g. after a failed
 * submit) to move the user there. Doing both reads it out twice.
 */
@Component({
	selector: 'app-feedback-card',
	templateUrl: './feedback-card.component.html',
	styleUrl: './feedback-card.component.scss',
	host: {
		tabindex: '-1',
		'[class]': 'variant()',
		'[attr.role]': 'role()',
		// A static `title="…"` would also stay on the host as a tooltip.
		'[attr.title]': 'null'
	}
})
export class FeedbackCardComponent {
	public readonly variant = input<FeedbackVariant>('error');
	public readonly title = input.required<string>();
	/** A Material Icons ligature, e.g. `error`; leave out for a text-only card. */
	public readonly icon = input<string>();

	protected readonly role = computed(() => feedbackRole(this.variant()));
}
