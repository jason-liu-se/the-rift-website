import { Component, input, output } from '@angular/core';

/**
 * A short notice at the bottom of the screen with a dismiss button; shown by
 * `ToastService`, which also pauses its timer while `paused`.
 */
@Component({
	selector: 'app-toast',
	templateUrl: './toast.component.html',
	styleUrls: ['./toast.component.scss'],
	host: {
		'(mouseenter)': 'paused.emit()',
		'(mouseleave)': 'resumed.emit()',
		'(focusin)': 'paused.emit()',
		'(focusout)': 'resumed.emit()'
	}
})
export class ToastComponent {
	public readonly message = input.required<string>();
	public readonly dismissed = output();
	/** While hovered or focused, so there's time to read it or press Dismiss. */
	public readonly paused = output();
	public readonly resumed = output();
}
