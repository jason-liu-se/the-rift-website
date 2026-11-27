import { Component, input } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { DraftType } from 'src/app/core/api/api-requests';
import { DraftSession } from '../drafts/draft-session';

/** A draft's undo and redo buttons. */
@Component({
	selector: 'app-draft-history',
	templateUrl: './draft-history.html',
	styleUrl: './draft-history.scss',
	imports: [MatIcon, MatIconButton, MatTooltip]
})
export class DraftHistory {
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
