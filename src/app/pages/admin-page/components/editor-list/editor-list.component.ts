import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, computed, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressBar } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { EDITOR_PAGE_SIZE } from 'src/app/config/admin';
import { FallbackPanelComponent } from 'src/app/components/fallback-panel/fallback-panel.component';
import { CollectionsStore } from '../../services/collections-store.service';
import { toCollectionType } from '../../editor-types';
import { BulkActionBarComponent } from './bulk-action-bar/bulk-action-bar.component';
import { DRAFT_NOUN, countItems } from './bulk-results';
import { EditorListStore } from './editor-list.store';
import {
	ListFiltersComponent,
	NO_FILTERS
} from './list-filters/list-filters.component';
import { RowGroupComponent } from './row-group/row-group.component';

/**
 * A tool's list: filters (or, while rows are selected, bulk actions in their
 * place), the editor's unpublished changes and every item as two groups of
 * one table, and pages. Ctrl+A previews selecting the page; Enter or Space
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
		MatButton,
		MatIcon,
		MatPaginator,
		MatProgressBar,
		RouterLink,
		RowGroupComponent
	],
	host: { '(keydown)': 'handleSelectionKeys($event)' }
})
export class EditorListComponent {
	private announcer = inject(LiveAnnouncer);
	private collectionsStore = inject(CollectionsStore);

	protected readonly store = inject(EditorListStore);
	protected readonly pageSize = EDITOR_PAGE_SIZE;

	protected readonly noun = computed(() => this.store.config().noun);
	protected readonly collections = computed(() => {
		const type = toCollectionType(this.store.type());
		return type ? this.collectionsStore.collections(type)() : undefined;
	});
	protected readonly showsPublished = computed(
		() => this.store.filters().status !== 'draft'
	);
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
		const config = this.store.config();
		const { sort, collection } = this.store.filters();
		return (
			config.isOrderable &&
			!collection &&
			(!sort || sort === config.sortOptions[0]?.sort)
		);
	});
	/** Anything but the sort is set, so an empty list means "no matches". */
	protected readonly hasFilters = computed(() => {
		const filters = this.store.filters();
		return (
			JSON.stringify(filters) !==
			JSON.stringify({ ...NO_FILTERS, sort: filters.sort })
		);
	});

	protected clearFilters(): void {
		this.store.setFilters({ ...NO_FILTERS, sort: this.store.filters().sort });
	}

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
