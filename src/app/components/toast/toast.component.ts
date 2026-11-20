import { Component, input } from '@angular/core';

/** A short notice at the bottom of the screen; shown by `ToastService`. */
@Component({
	selector: 'app-toast',
	template: '<p class="message">{{ message() }}</p>',
	styleUrls: ['./toast.component.scss']
})
export class ToastComponent {
	public readonly message = input.required<string>();
}
