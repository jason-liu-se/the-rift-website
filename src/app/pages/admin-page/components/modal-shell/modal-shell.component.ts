import {
	Component,
	afterNextRender,
	ElementRef,
	input,
	output,
	viewChild
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

let nextId = 0;

/**
 * The admin modals' frame: a header (title, the modal's own tools, Close)
 * and a footer that stay in view, with the content scrolling between them.
 * Project tools with `modalTools` and the footer with `modalFooter`. It
 * focuses its heading on opening, so screen readers start there.
 */
@Component({
	selector: 'app-modal-shell',
	templateUrl: './modal-shell.component.html',
	styleUrl: './modal-shell.component.scss',
	imports: [MatIcon, MatIconButton, MatTooltip]
})
export class ModalShellComponent {
	public readonly heading = input.required<string>();
	public readonly closed = output<void>();

	protected readonly headingId = `modal-heading-${nextId++}`;
	private readonly headingElement =
		viewChild.required<ElementRef<HTMLElement>>('headingElement');
	private readonly body = viewChild.required<ElementRef<HTMLElement>>('body');

	constructor() {
		afterNextRender(() => this.focusHeading());
	}

	public focusHeading(): void {
		this.headingElement().nativeElement.focus();
	}

	public scrollToTop(): void {
		this.body().nativeElement.scrollTo({ top: 0 });
	}
}
