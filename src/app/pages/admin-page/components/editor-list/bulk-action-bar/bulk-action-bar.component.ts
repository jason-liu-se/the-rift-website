import { NgComponentOutlet } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { countItems } from '../bulk-results';
import { EditorListActions } from '../editor-list.actions';
import { EditorListStore } from '../editor-list.store';

/**
 * In the filters' place while rows are selected: "N of M selected", the
 * actions every type has, and the type's own. Show and Hide count only the
 * published items selected (drafts have no visibility).
 */
@Component({
	selector: 'app-bulk-action-bar',
	templateUrl: './bulk-action-bar.component.html',
	styleUrl: './bulk-action-bar.component.scss',
	imports: [MatButton, NgComponentOutlet]
})
export class BulkActionBarComponent {
	protected readonly store = inject(EditorListStore);
	protected readonly actions = inject(EditorListActions);

	/** Only drafts are selected: actions other than Delete don't apply. */
	protected readonly hasItems = computed(
		() => this.store.selectedItemCount() > 0
	);
	/** "3 posts": the published items an action other than Delete acts on. */
	protected readonly selectedItems = computed(() =>
		this.hasItems()
			? countItems(
					this.store.selectedItemCount(),
					this.store.config().noun
				)
			: ''
	);
	/** The whole page is selected, but not every match. */
	protected readonly canSelectAllMatching = computed(
		() =>
			!this.store.selection.isAllMatching() &&
			this.store.selection.isPageSelected(this.store.pageRows()) &&
			this.store.total() > this.store.itemRows().length
	);
	protected readonly allMatchingLabel = computed(
		() =>
			`Select all ${countItems(this.store.total(), this.store.config().noun)} matching`
	);
}
