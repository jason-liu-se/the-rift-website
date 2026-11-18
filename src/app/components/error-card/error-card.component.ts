import { Component, computed, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { FeedbackVariant, feedbackRole } from './feedback-variant';

/**
 * Inline feedback (a failed form submit, a warning, a success) with a title
 * and the projected message. Focusable by script (`tabindex="-1"`), so a form
 * can move focus to it after a failed submit.
 */
@Component({
	selector: 'app-error-card',
	imports: [MatIcon],
	templateUrl: './error-card.component.html',
	styleUrl: './error-card.component.scss',
	host: {
		tabindex: '-1',
		'[class]': 'variant()',
		'[attr.role]': 'role()',
		// A static `title="…"` would also stay on the host as a tooltip.
		'[attr.title]': 'null'
	}
})
export class ErrorCardComponent {
	public readonly variant = input<FeedbackVariant>('error');
	public readonly title = input.required<string>();
	/** A Material Icons name, e.g. `error`; leave out for a text-only card. */
	public readonly icon = input<string>();

	protected readonly role = computed(() => feedbackRole(this.variant()));
}
