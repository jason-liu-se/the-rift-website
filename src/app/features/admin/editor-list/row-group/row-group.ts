import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { EditorListStore } from '../editor-list-store';
import { EditorRow } from '../editor-row/editor-row';
import { RowLayout, toRowMenu } from '../row-actions';
import { EditorListActions } from '../editor-list-actions';
import { ListRow } from '../list-rows';

/**
 * A collapsible group of an admin list's rows (Unpublished changes, All): its name
 * and count, a checkbox for its rows on this page, and the rows, which can
 * be dragged into order when the list allows it (items only).
 */
@Component({
	// A table's rows must be its own elements.
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: 'tbody[app-row-group]',
	templateUrl: './row-group.html',
	styleUrl: './row-group.scss',
	imports: [CdkDrag, EditorRow, MatCheckbox, MatIcon],
	hostDirectives: [CdkDropList],
	host: { role: 'rowgroup', '[class.cards]': "layout() === 'card'" }
})
export class RowGroup {
	private store = inject(EditorListStore);
	private actions = inject(EditorListActions);

	public readonly label = input.required<string>();
	public readonly rows = input.required<readonly ListRow[]>();
	/** How many there are in all, if more than this page shows. */
	public readonly count = input<number>();
	public readonly layout = input<RowLayout>('row');

	protected readonly isExpanded = signal(true);
	protected readonly headerSpan = computed(
		() => this.store.columnCount() - 1
	);
	protected readonly isReorderable = computed(
		() =>
			this.store.isReorderable() &&
			this.rows().every(({ kind }) => kind === 'item')
	);

	/** Each row with what its view shows. */
	protected readonly rowViews = computed(() => {
		const { columns, cellContext, selection, itemRows } = this.store;
		// Links keep the list's query, so they change with it.
		this.store.filters();
		this.store.pageIndex();
		const layout = this.layout();
		const items = itemRows();
		const isPreviewing = selection.isPreviewingPage();
		return this.rows().map((row) => {
			const index =
				this.isReorderable() && row.kind === 'item'
					? items.findIndex(({ id }) => id === row.id)
					: undefined;
			return {
				row,
				cells: columns().map((column) => ({
					column,
					inputs: column.inputs(row.data, cellContext)
				})),
				href: this.store.hrefOf(row),
				isSelected: isPreviewing || this.isRowSelected(row),
				index,
				menu: toRowMenu(row, {
					layout,
					index,
					itemCount: items.length,
					publicPath: this.publicPathOf(row),
					actions: this.actions
				})
			};
		});
	});
	/** This group's rows on the page, as the selection takes them. */
	private readonly groupRows = computed(() => {
		const rows = this.rows();
		return {
			items: rows.flatMap((row) =>
				row.kind === 'item' ? [row.ref] : []
			),
			draftIds: rows.flatMap((row) =>
				row.kind === 'draft' ? [row.id] : []
			)
		};
	});
	protected readonly isAllSelected = computed(() =>
		this.store.selection.isPageSelected(this.groupRows())
	);
	protected readonly isSomeSelected = computed(() =>
		this.rows().some((row) => this.isRowSelected(row))
	);

	constructor() {
		inject(CdkDropList)
			.dropped.pipe(takeUntilDestroyed())
			.subscribe(({ previousIndex, currentIndex }) =>
				this.actions.moveItem(previousIndex, currentIndex)
			);
	}

	protected toggleSelected(isChecked: boolean): void {
		if (isChecked) {
			this.store.selection.selectPage(this.groupRows());
		} else {
			this.store.selection.unselectPage(this.groupRows());
		}
	}

	protected open(row: ListRow): void {
		this.store.open(row);
	}

	protected toggleRowSelected(row: ListRow): void {
		if (row.kind === 'draft') {
			this.store.selection.toggleDraft(row.id);
		} else {
			this.store.selection.toggle(row.ref, this.store.pageRows());
		}
	}

	private isRowSelected(row: ListRow): boolean {
		return row.kind === 'draft'
			? this.store.selection.isDraftSelected(row.id)
			: this.store.selection.isSelected(row.id);
	}

	/** Where a live item shows on the site. */
	private publicPathOf(row: ListRow): string | undefined {
		return row.kind === 'item' && row.item.status === 'live'
			? (this.store.config().publicPath as (item: object) => string)(
					row.item
				)
			: undefined;
	}
}
