import { computed, signal } from '@angular/core';
import { BulkItemRef } from 'src/app/interfaces/api-requests';

/** The rows a page of the list shows: the editor's drafts, then items. */
export interface PageRows {
	items: readonly BulkItemRef[];
	draftIds: readonly string[];
}

/**
 * Which rows of an admin list are selected: some items (with the revision
 * each was read at, for the bulk request) or every item matching the filters,
 * across pages, plus any of the editor's drafts. Ctrl+A first previews
 * selecting the page's rows, which the user confirms or cancels.
 */
export class ListSelection {
	private readonly refs = signal<ReadonlyMap<string, number>>(new Map());
	private readonly drafts = signal<ReadonlySet<string>>(new Set());
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
	public readonly selectedDraftIds = computed(() => [...this.drafts()]);

	/** How many are selected, given how many items match the filters. */
	public count(total: number): number {
		return (
			(this.allMatching() ? total : this.refs().size) + this.drafts().size
		);
	}

	public isSelected(id: string): boolean {
		return this.allMatching() || this.refs().has(id);
	}

	public isDraftSelected(id: string): boolean {
		return this.drafts().has(id);
	}

	/**
	 * Selects or unselects one item of `page`. Unselecting one while all
	 * matching are selected leaves the rest of the page selected.
	 */
	public toggle(ref: BulkItemRef, page: PageRows): void {
		if (this.allMatching()) {
			this.selectPage(page);
		}
		const refs = new Map(this.refs());
		if (refs.has(ref.id)) {
			refs.delete(ref.id);
		} else {
			refs.set(ref.id, ref.startingRevision);
		}
		this.setRows(refs, this.drafts(), this.allMatching());
	}

	public toggleDraft(id: string): void {
		const drafts = new Set(this.drafts());
		if (!drafts.delete(id)) {
			drafts.add(id);
		}
		this.setRows(this.refs(), drafts, this.allMatching());
	}

	/** Selects every row on the page, keeping other selected rows. */
	public selectPage({ items, draftIds }: PageRows): void {
		const refs = new Map(this.allMatching() ? [] : this.refs());
		for (const { id, startingRevision } of items) {
			refs.set(id, startingRevision);
		}
		this.setRows(refs, new Set([...this.drafts(), ...draftIds]));
	}

	/** Unselects every row on the page (and ends "all matching"). */
	public unselectPage({ items, draftIds }: PageRows): void {
		const refs = new Map(this.allMatching() ? [] : this.refs());
		for (const { id } of items) {
			refs.delete(id);
		}
		const drafts = new Set(this.drafts());
		draftIds.forEach((id) => drafts.delete(id));
		this.setRows(refs, drafts);
	}

	public isPageSelected({ items, draftIds }: PageRows): boolean {
		return (
			items.length + draftIds.length > 0 &&
			items.every(({ id }) => this.isSelected(id)) &&
			draftIds.every((id) => this.isDraftSelected(id))
		);
	}

	/** Selects every matching item, keeping any selected drafts. */
	public selectAllMatching(): void {
		this.setRows(new Map(), this.drafts(), true);
	}

	public previewPage(): void {
		this.previewing.set(true);
	}

	/** Ends a Ctrl+A preview: selects the page if confirmed. */
	public endPreview(page: PageRows, isConfirmed: boolean): void {
		this.previewing.set(false);
		if (isConfirmed) {
			this.selectPage(page);
		}
	}

	public clear(): void {
		this.setRows(new Map(), new Set());
	}

	private setRows(
		refs: ReadonlyMap<string, number>,
		drafts: ReadonlySet<string>,
		isAllMatching = false
	): void {
		this.refs.set(refs);
		this.drafts.set(drafts);
		this.allMatching.set(isAllMatching);
		this.previewing.set(false);
	}
}
