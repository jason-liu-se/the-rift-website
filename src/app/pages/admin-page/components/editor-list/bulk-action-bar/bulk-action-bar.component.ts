import { Component, computed, input, output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { ItemNoun, countItems } from '../bulk-results';

/** What the bar's own buttons do; other actions are projected in. */
export type CommonBulkAction = 'show' | 'hide' | 'delete';

/**
 * Above an admin list while rows are selected: "N of M selected", the actions
 * every type has, and any of the type's own (projected `[bulkActions]`).
 */
@Component({
	selector: 'app-bulk-action-bar',
	templateUrl: './bulk-action-bar.component.html',
	styleUrl: './bulk-action-bar.component.scss',
	imports: [MatButton]
})
export class BulkActionBarComponent {
	public readonly selectedCount = input.required<number>();
	/** How many rows can be selected: the matching items and listed drafts. */
	public readonly total = input.required<number>();
	/** How many items match the filters, for "Select all … matching". */
	public readonly matchingCount = input.required<number>();
	public readonly noun = input.required<ItemNoun>();
	/** The whole page is selected, but not every match. */
	public readonly canSelectAllMatching = input(false);
	public readonly isAllMatching = input(false);
	/** A bulk action is running; actions wait for it. */
	public readonly isBusy = input(false);

	public readonly runAction = output<CommonBulkAction>();
	public readonly selectAllMatching = output<void>();
	public readonly clearSelection = output<void>();

	protected readonly allMatchingLabel = computed(
		() =>
			`Select all ${countItems(this.matchingCount(), this.noun())} matching`
	);
}
