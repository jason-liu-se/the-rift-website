import { Component, computed, input, output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { EditorContentType } from 'src/app/interfaces/api-requests';
import { DraftSession } from '../../../drafts/draft-session';
import { EDITOR_TYPES } from '../../../editor-types';
import { toFieldRows } from '../field-values';

/**
 * A draft's conflict, if any (their version beside the choices to resolve
 * it), and while merging by hand, their version to copy from.
 */
@Component({
	selector: 'app-draft-conflict',
	templateUrl: './draft-conflict.component.html',
	styleUrl: './draft-conflict.component.scss',
	imports: [MatButton]
})
export class DraftConflictComponent {
	public readonly session = input.required<DraftSession<EditorContentType>>();

	/** Overwrite the changed item with this draft (publish again). */
	public readonly overwrite = output<void>();
	public readonly publishAsNew = output<void>();
	public readonly discard = output<void>();

	private readonly config = computed(() => EDITOR_TYPES[this.session().type]);
	protected readonly noun = computed(() => this.config().noun);
	protected readonly conflictRows = computed(() => {
		const conflict = this.session().conflict();
		const labels = this.config().fieldLabels;
		if (conflict?.kind === 'draft') {
			return toFieldRows(conflict.theirs.fields, labels);
		}
		return conflict?.kind === 'item'
			? toFieldRows(conflict.theirs, labels)
			: [];
	});
	protected readonly mergeRows = computed(() => {
		const reference = this.session().mergeReference();
		return reference
			? toFieldRows(reference, this.config().fieldLabels)
			: [];
	});

	protected keepDraft(keep: 'mine' | 'theirs'): void {
		this.session().resolveDraftConflict(keep).subscribe();
	}

	protected merge(): void {
		this.session().resolveItemConflict('merge').subscribe();
	}

	protected stopMerging(): void {
		this.session().mergeReference.set(undefined);
	}
}
