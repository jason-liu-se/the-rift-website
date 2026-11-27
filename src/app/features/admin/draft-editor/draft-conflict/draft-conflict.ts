import { Component, computed, input, output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { DraftType } from 'src/app/core/api/api-requests';
import { DraftSession } from '../../drafts/draft-session';
import { ItemNoun } from '../../editor-list/bulk-results';
import { toFieldRows } from '../field-values';

/**
 * A draft's conflict, if any (their version beside the choices to resolve
 * it), and while merging by hand, their version to copy from.
 */
@Component({
	selector: 'app-draft-conflict',
	templateUrl: './draft-conflict.html',
	styleUrl: './draft-conflict.scss',
	imports: [MatButton]
})
export class DraftConflict {
	public readonly session = input.required<DraftSession<DraftType>>();
	/** How the draft's item is named: "post". */
	public readonly noun = input.required<ItemNoun>();
	/** Each field's label, in the order their versions are listed. */
	public readonly fieldLabels = input.required<Record<string, string>>();

	/** Overwrite the changed item with this draft (publish again). */
	public readonly overwrite = output<void>();
	public readonly publishAsNew = output<void>();
	public readonly discard = output<void>();

	protected readonly conflictRows = computed(() => {
		const conflict = this.session().conflict();
		const labels = this.fieldLabels();
		if (conflict?.kind === 'draft') {
			return toFieldRows(conflict.theirs.fields, labels);
		}
		return conflict?.kind === 'item'
			? toFieldRows(conflict.theirs, labels)
			: [];
	});
	protected readonly mergeRows = computed(() => {
		const reference = this.session().mergeReference();
		return reference ? toFieldRows(reference, this.fieldLabels()) : [];
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
