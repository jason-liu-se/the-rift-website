import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, computed, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressBar } from '@angular/material/progress-bar';
import { EDITOR_PAGE_SIZE } from 'src/app/core/config/admin';
import { FallbackPanel } from 'src/app/shared/ui/fallback-panel/fallback-panel';
import { BulkActionBar } from './bulk-action-bar/bulk-action-bar';
import { DRAFT_NOUN, countItems } from './bulk-results';
import { EditorListStore } from './editor-list-store';
import { COLLECTION_FILTER } from './list-filter-fields';
import { ListFilters } from './list-filters/list-filters';
import { ListTable } from './list-views/list-table/list-table';

/**
 * A tool's list: filters (or, while rows are selected, bulk actions in their
 * place), the rows in the type's view (a table, or a grid of cards), and
 * pages. Ctrl+A selects the page's rows; Escape clears the selection.
 */
@Component({
	selector: 'app-editor-list',
	templateUrl: './editor-list.html',
	styleUrl: './editor-list.scss',
	imports: [
		BulkActionBar,
		FallbackPanel,
		ListFilters,
		ListTable,
		MatIcon,
		MatPaginator,
		MatProgressBar
	],
	host: { '(document:keydown)': 'handleSelectionKeys($event)' }
})
export class EditorList {
	private announcer = inject(LiveAnnouncer);
	private dialog = inject(MatDialog);

	protected readonly store = inject(EditorListStore);
	protected readonly pageSize = EDITOR_PAGE_SIZE;

	protected readonly noun = computed(() => this.store.config().noun);
	/** "13 posts and 2 drafts": the rows on this page, for Ctrl+A. */
	protected readonly pageRowsText = computed(() => {
		const { items, draftIds } = this.store.pageRows();
		return [
			countItems(items.length, this.noun()),
			countItems(draftIds.length, DRAFT_NOUN)
		]
			.filter((part) => !part.startsWith('0 '))
			.join(' and ');
	});

	/** In the site's order, but across collections: say how to reorder. */
	protected readonly isOrderHintShown = computed(() => {
		return (
			this.store.config().isOrderable &&
			!this.store.filters().values[COLLECTION_FILTER.key] &&
			this.store.isDefaultSort()
		);
	});
	protected changePage({ pageIndex }: PageEvent): void {
		this.store.setPage(pageIndex);
	}

	/**
	 * Ctrl+A selects the page; Escape clears the selection. Anywhere on the
	 * page (focus is often on its body), but not in a text field, or in a
	 * modal or menu over the list.
	 */
	protected handleSelectionKeys(event: KeyboardEvent): void {
		const target = event.target as HTMLElement;
		const isElsewhere = !!target.closest?.(
			'input:not([type="checkbox"]), textarea, [role="combobox"], [role="listbox"], .cdk-overlay-container'
		);
		if (isElsewhere || this.dialog.openDialogs.length > 0) {
			return;
		}
		const isSelectAll =
			(event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a';
		if (isSelectAll && this.store.pageRowCount() > 0) {
			event.preventDefault();
			this.store.selection.selectPage(this.store.pageRows());
			this.announcer.announce(`Selected ${this.pageRowsText()}.`);
		} else if (event.key === 'Escape' && this.store.selectedCount() > 0) {
			this.store.selection.clear();
			this.announcer.announce('Selection cleared.');
		}
	}
}
