import { computed, signal } from '@angular/core';
import { BulkItemRef } from 'src/app/interfaces/api-requests';

/**
 * Which rows of an admin list are selected: some rows (with the revision each
 * was read at, for the bulk request), or every item matching the filters,
 * across pages. Ctrl+A first previews selecting the page's rows, which the
 * user confirms or cancels.
 */
export class ListSelection {
	private readonly refs = signal<ReadonlyMap<string, number>>(new Map());
	private readonly allMatching = signal(false);
	private readonly previewing = signal(false);

	/** Every item matching the filters is selected, on every page. */
	public readonly isAllMatching = this.allMatching.asReadonly();
	/** Ctrl+A is waiting for Enter or Space (confirm) or Escape (cancel). */
	public readonly isPreviewingPage = this.previewing.asReadonly();
	public readonly selectedRefs = computed<BulkItemRef[]>(() =>
		[...this.refs()].map(([id, startingRevision]) => ({
			id,
			startingRevision
		}))
	);

	/** How many are selected, given how many items match the filters. */
	public count(total: number): number {
		return this.allMatching() ? total : this.refs().size;
	}

	public isSelected(id: string): boolean {
		return this.allMatching() || this.refs().has(id);
	}

	/**
	 * Selects or unselects one row of `page`. Unselecting one while all
	 * matching are selected leaves the rest of the page selected.
	 */
	public toggle(ref: BulkItemRef, page: readonly BulkItemRef[]): void {
		if (this.allMatching()) {
			this.selectPage(page);
		}
		const refs = new Map(this.refs());
		if (refs.has(ref.id)) {
			refs.delete(ref.id);
		} else {
			refs.set(ref.id, ref.startingRevision);
		}
		this.setRows(refs);
	}

	/** Selects every row on the page, keeping other selected rows. */
	public selectPage(page: readonly BulkItemRef[]): void {
		const refs = new Map(this.allMatching() ? [] : this.refs());
		for (const { id, startingRevision } of page) {
			refs.set(id, startingRevision);
		}
		this.setRows(refs);
	}

	/** Unselects every row on the page (and ends "all matching"). */
	public unselectPage(page: readonly BulkItemRef[]): void {
		const refs = new Map(this.allMatching() ? [] : this.refs());
		for (const { id } of page) {
			refs.delete(id);
		}
		this.setRows(refs);
	}

	public isPageSelected(page: readonly BulkItemRef[]): boolean {
		return page.length > 0 && page.every(({ id }) => this.isSelected(id));
	}

	public selectAllMatching(): void {
		this.refs.set(new Map());
		this.allMatching.set(true);
		this.previewing.set(false);
	}

	public previewPage(): void {
		this.previewing.set(true);
	}

	/** Ends a Ctrl+A preview: selects the page if confirmed. */
	public endPreview(
		page: readonly BulkItemRef[],
		isConfirmed: boolean
	): void {
		this.previewing.set(false);
		if (isConfirmed) {
			this.selectPage(page);
		}
	}

	public clear(): void {
		this.setRows(new Map());
	}

	private setRows(refs: ReadonlyMap<string, number>): void {
		this.refs.set(refs);
		this.allMatching.set(false);
		this.previewing.set(false);
	}
}
