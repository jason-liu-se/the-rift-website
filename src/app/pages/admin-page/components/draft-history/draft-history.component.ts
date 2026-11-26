import { Component, input } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { DraftType } from 'src/app/interfaces/api-requests';
import { DraftSession } from '../../drafts/draft-session';

/** A draft's undo and redo buttons. */
@Component({
	selector: 'app-draft-history',
	template: `<button
			mat-icon-button
			type="button"
			aria-label="Undo"
			matTooltip="Undo (Ctrl+Z)"
			[disabled]="!session().canUndo()"
			(click)="session().undo()"
		>
			<mat-icon>undo</mat-icon>
		</button>
		<button
			mat-icon-button
			type="button"
			aria-label="Redo"
			matTooltip="Redo (Ctrl+Shift+Z)"
			[disabled]="!session().canRedo()"
			(click)="session().redo()"
		>
			<mat-icon>redo</mat-icon>
		</button>`,
	styles: ':host { display: inline-flex; }',
	imports: [MatIcon, MatIconButton, MatTooltip]
})
export class DraftHistoryComponent {
	public readonly session = input.required<DraftSession<DraftType>>();
}

/**
 * Undoes or redoes on Ctrl+Z and Ctrl+Shift+Z (or Ctrl+Y), outside a text
 * field's own undo. For a draft editor's `keydown`.
 */
export function handleHistoryShortcut(
	event: KeyboardEvent,
	session: DraftSession<DraftType>
): void {
	const isTyping = !!(event.target as HTMLElement).closest?.(
		'input, textarea'
	);
	if (isTyping || !(event.ctrlKey || event.metaKey)) {
		return;
	}
	const key = event.key.toLowerCase();
	if (key === 'z' && !event.shiftKey && session.canUndo()) {
		event.preventDefault();
		session.undo();
	} else if (
		(key === 'y' || (key === 'z' && event.shiftKey)) &&
		session.canRedo()
	) {
		event.preventDefault();
		session.redo();
	}
}
