import { NgComponentOutlet } from '@angular/common';
import { Component, computed, inject, output } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { countItems } from '../bulk-results';
import { EditorListActions } from '../editor-list.actions';
import { EditorListStore } from '../editor-list.store';

/**
 * In the toolbar's place while rows are selected: "N selected", the actions
 * every type has, and the type's own, with Delete last. Show and Hide appear
 * only when they'd change something, counting the items they'd change
 * (drafts have no visibility; with every match selected, counts are unknown).
 */
@Component({
	selector: 'app-bulk-action-bar',
	templateUrl: './bulk-action-bar.html',
	styleUrl: './bulk-action-bar.scss',
	imports: [MatButton, MatIcon, MatIconButton, MatTooltip, NgComponentOutlet]
})
export class BulkActionBar {
	protected readonly store = inject(EditorListStore);
	protected readonly actions = inject(EditorListActions);

	/** The selection was cleared here: its button is gone, so focus moves. */
	public readonly cleared = output<void>();

	/** Only drafts are selected: actions other than Delete don't apply. */
	protected readonly hasItems = computed(
		() => this.store.selectedItemCount() > 0
	);
	/** The selected items on this page; every match is selected beyond it. */
	private readonly selectedRows = computed(() =>
		this.store
			.itemRows()
			.filter(({ id }) => this.store.selection.isSelected(id))
	);
	/** How many Show would change: '' for none, all for every match. */
	protected readonly showCount = computed(() =>
		this.countChanging((visible) => !visible)
	);
	protected readonly hideCount = computed(() =>
		this.countChanging((visible) => visible)
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

	protected clearSelection(): void {
		this.store.selection.clear();
		this.cleared.emit();
	}

	private countChanging(wouldChange: (visible: boolean) => boolean): string {
		if (!this.hasItems()) {
			return '';
		}
		if (this.store.selection.isAllMatching()) {
			return 'all';
		}
		const count = this.selectedRows().filter(({ item }) =>
			wouldChange(item.visible)
		).length;
		return count > 0 ? String(count) : '';
	}
}
