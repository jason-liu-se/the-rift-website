import { Observable } from 'rxjs';
import { DraftType } from 'src/app/core/api/api-requests';
import { EditorWriteService } from '../editor-write.service';
import { DraftSession } from './draft-session';

/**
 * Discards the session's draft once the editor confirms. Emits whether it
 * was discarded.
 */
export function discardDraft(
	writer: EditorWriteService,
	session: DraftSession<DraftType>,
	noun: string,
	isEdit: boolean
): Observable<boolean> {
	return writer.run({
		confirm: isEdit
			? {
					title: 'Discard your changes?',
					message: `The published ${noun} stays as it is.`,
					confirmLabel: 'Discard changes'
				}
			: {
					title: `Discard this ${noun}?`,
					message: "It hasn't been published, so it'll be gone.",
					confirmLabel: 'Discard'
				},
		request: () => session.discard()
	});
}
