import { Component, computed, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { EditorListStore } from '../../editor-list.store';
import { NO_FILTERS, countSetFilters } from '../../list-filter-fields';

/**
 * A list's empty state, as its table's last row group: nothing matches the
 * filters (with a way to clear them), or nothing's there yet (with a way to
 * add some).
 */
@Component({
	// A table's row groups must be its own elements.
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: 'tbody[app-list-empty]',
	templateUrl: './list-empty.html',
	styleUrl: './list-empty.scss',
	imports: [MatButton, MatIcon, RouterLink],
	host: { role: 'rowgroup' }
})
export class ListEmpty {
	protected readonly store = inject(EditorListStore);

	protected readonly noun = computed(() => this.store.config().noun);
	/** Anything but the sort is set, so an empty list means "no matches". */
	protected readonly hasFilters = computed(() => {
		const filters = this.store.filters();
		return !!filters.search || countSetFilters(filters) > 0;
	});

	protected clearFilters(): void {
		const { sort, order } = this.store.filters();
		this.store.setFilters({ ...NO_FILTERS, sort, order });
	}
}
