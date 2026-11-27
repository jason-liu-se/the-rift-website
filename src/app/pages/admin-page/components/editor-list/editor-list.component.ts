import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, computed, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressBar } from '@angular/material/progress-bar';
import { EDITOR_PAGE_SIZE } from 'src/app/core/config/admin';
import { FallbackPanelComponent } from 'src/app/shared/ui/fallback-panel/fallback-panel.component';
import { BulkActionBarComponent } from './bulk-action-bar/bulk-action-bar.component';
import { DRAFT_NOUN, countItems } from './bulk-results';
import { EditorListStore } from './editor-list.store';
import { COLLECTION_FILTER } from './list-filter-fields';
import { ListFiltersComponent } from './list-filters/list-filters.component';
import { ListGridComponent } from './list-views/list-grid/list-grid.component';
import { ListTableComponent } from './list-views/list-table/list-table.component';

/**
 * A tool's list: filters (or, while rows are selected, bulk actions in their
 * place), the rows in the type's view (a table, or a grid of cards), and
 * pages. Ctrl+A previews selecting the page; Enter or Space
 * confirms, Escape cancels (or clears a selection).
 */
@Component({
	selector: 'app-editor-list',
	templateUrl: './editor-list.component.html',
	styleUrl: './editor-list.component.scss',
	imports: [
		BulkActionBarComponent,
		FallbackPanelComponent,
		ListFiltersComponent,
		ListGridComponent,
		ListTableComponent,
		MatIcon,
		MatPaginator,
		MatProgressBar
	],
	host: { '(keydown)': 'handleSelectionKeys($event)' }
})
export class EditorListComponent {
	private announcer = inject(LiveAnnouncer);

	protected readonly store = inject(EditorListStore);
	protected readonly pageSize = EDITOR_PAGE_SIZE;

	protected readonly noun = computed(() => this.store.config().noun);
	/** "13 posts and 2 drafts": the rows on this page, for Ctrl+A's preview. */
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

	/** Ctrl+A previews selecting the page; Enter/Space confirm, Escape cancels. */
	protected handleSelectionKeys(event: KeyboardEvent): void {
		const { selection, pageRows } = this.store;
		const target = event.target as HTMLElement;
		const isTyping = !!target.closest?.(
			'input:not([type="checkbox"]), textarea, [role="combobox"], [role="listbox"]'
		);
		if (selection.isPreviewingPage()) {
			const isConfirmed = event.key === 'Enter' || event.key === ' ';
			if (isConfirmed || event.key === 'Escape') {
				event.preventDefault();
				selection.endPreview(pageRows(), isConfirmed);
				this.announcer.announce(
					isConfirmed
						? `Selected ${this.pageRowsText()}.`
						: 'Selection cancelled.'
				);
			}
			return;
		}
		if (isTyping) {
			return;
		}
		const isSelectAll =
			(event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a';
		if (isSelectAll && this.store.pageRowCount() > 0) {
			event.preventDefault();
			selection.previewPage();
			this.announcer.announce(
				`Select all ${this.pageRowsText()} on this page? Press Enter or Space to select them, or Escape to cancel.`
			);
		} else if (event.key === 'Escape' && this.store.selectedCount() > 0) {
			selection.clear();
			this.announcer.announce('Selection cleared.');
		}
	}
}
