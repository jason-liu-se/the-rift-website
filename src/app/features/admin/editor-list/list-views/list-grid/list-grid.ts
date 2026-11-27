import { Component, inject } from '@angular/core';
import { EditorListStore } from '../../editor-list.store';
import { RowGroup } from '../../row-group/row-group';
import { ListEmpty } from '../list-empty/list-empty';

/**
 * A list as a grid of cards on every screen (the gallery's images): each
 * row group's cards under its header, without column headings (the filters
 * have a Sort by field instead).
 */
@Component({
	selector: 'app-list-grid',
	templateUrl: './list-grid.html',
	styleUrl: './list-grid.scss',
	imports: [ListEmpty, RowGroup]
})
export class ListGrid {
	protected readonly store = inject(EditorListStore);
}
