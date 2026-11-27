import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, computed, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { EditorListStore } from '../../editor-list-store';
import { toSortColumn } from '../../list-columns';
import { SortColumn, currentSort, sortByColumn } from '../../list-sort';
import { RowGroup } from '../../row-group/row-group';
import { ListEmpty } from '../list-empty/list-empty';

/**
 * A list as a table: a heading per column (sorting by it, if it sorts), and
 * the unpublished changes and every item as row groups, which can be dragged
 * into order when the list allows it. Phones show its rows as cards.
 */
@Component({
	selector: 'app-list-table',
	templateUrl: './list-table.html',
	styleUrl: './list-table.scss',
	imports: [ListEmpty, MatIcon, RowGroup]
})
export class ListTable {
	private announcer = inject(LiveAnnouncer);
	protected readonly store = inject(EditorListStore);

	protected readonly headings = computed(() =>
		this.store.columns().map((column) => ({
			column,
			sort: toSortColumn(column)
		}))
	);

	protected ariaSort(column: SortColumn): string | null {
		const { sort, order } = this.store.sort();
		if (sort !== column.sort) {
			return null;
		}
		return order === 'asc' ? 'ascending' : 'descending';
	}

	/** The current direction, or (dimmed) the one it would sort in. */
	protected sortIcon(column: SortColumn): string {
		const { sort, order } = this.store.sort();
		const shown = sort === column.sort ? order : column.firstOrder;
		return shown === 'asc' ? 'expand_less' : 'expand_more';
	}

	protected sortBy(column: SortColumn): void {
		const { defaultSort } = this.store.config();
		const params = sortByColumn(this.store.sort(), column, defaultSort);
		this.store.setFilters({ ...this.store.filters(), ...params });
		const { order } = currentSort(
			params,
			this.store.sortColumns(),
			defaultSort
		);
		this.announcer.announce(
			`Sorted by ${column.label}, ${order === 'asc' ? 'ascending' : 'descending'}.`
		);
	}
}
