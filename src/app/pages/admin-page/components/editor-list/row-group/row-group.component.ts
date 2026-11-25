import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { EditorListStore } from '../editor-list.store';
import { EditorRowComponent } from '../editor-row/editor-row.component';
import { EditorListActions } from '../editor-list.actions';
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
	templateUrl: './row-group.component.html',
	styleUrl: './row-group.component.scss',
	imports: [CdkDrag, EditorRowComponent, MatCheckbox, MatIcon],
	hostDirectives: [CdkDropList]
})
export class RowGroupComponent {
	private store = inject(EditorListStore);
	private actions = inject(EditorListActions);

	public readonly label = input.required<string>();
	public readonly rows = input.required<readonly ListRow[]>();
	/** How many there are in all, if more than this page shows. */
	public readonly count = input<number>();

	protected readonly isExpanded = signal(true);
	protected readonly isReorderable = computed(
		() =>
			this.store.isReorderable() &&
			this.rows().every(({ kind }) => kind === 'item')
	);

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
		this.rows().some((row) =>
			row.kind === 'draft'
				? this.store.selection.isDraftSelected(row.id)
				: this.store.selection.isSelected(row.id)
		)
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
}
