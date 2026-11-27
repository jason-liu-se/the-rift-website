import { Component, ElementRef, inject, input } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { DraftType } from 'src/app/core/api/api-requests';
import { DraftSession } from '../drafts/draft-session';

/**
 * A draft's undo and redo buttons, and their shortcuts (Ctrl+Z, and
 * Ctrl+Shift+Z or Ctrl+Y) anywhere in its modal.
 */
@Component({
	selector: 'app-draft-history',
	templateUrl: './draft-history.html',
	styleUrl: './draft-history.scss',
	imports: [MatIcon, MatIconButton, MatTooltip],
	host: { '(document:keydown)': 'handleShortcut($event)' }
})
export class DraftHistory {
	private host = inject<ElementRef<HTMLElement>>(ElementRef);

	public readonly session = input.required<DraftSession<DraftType>>();

	/**
	 * Text fields too, even with nothing to undo: their own undo would change
	 * the draft as a new edit, a second history the buttons don't follow.
	 */
	protected handleShortcut(event: KeyboardEvent): void {
		const isShortcut = (event.ctrlKey || event.metaKey) && !event.altKey;
		if (!isShortcut || !this.isForThisModal(event.target as Element)) {
			return;
		}
		const key = event.key.toLowerCase();
		const session = this.session();
		if (key === 'z' && !event.shiftKey) {
			event.preventDefault();
			if (session.canUndo()) {
				session.undo();
			}
		} else if (key === 'y' || (key === 'z' && event.shiftKey)) {
			event.preventDefault();
			if (session.canRedo()) {
				session.redo();
			}
		}
	}

	/**
	 * From inside this modal, or from the page's body while it's the top
	 * dialog: focus falls there when a focused Undo or Redo is disabled.
	 */
	private isForThisModal(target: Element): boolean {
		const modal = this.host.nativeElement.closest('[role="dialog"]');
		if (!modal) {
			return false;
		}
		if (target !== target.ownerDocument.body) {
			return modal.contains(target);
		}
		const dialogs = target.ownerDocument.querySelectorAll(
			'.cdk-overlay-container [role="dialog"]'
		);
		return dialogs[dialogs.length - 1] === modal;
	}
}
