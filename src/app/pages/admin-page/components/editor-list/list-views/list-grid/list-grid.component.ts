import { Component, inject } from '@angular/core';
import { EditorListStore } from '../../editor-list.store';
import { RowGroupComponent } from '../../row-group/row-group.component';
import { ListEmptyComponent } from '../list-empty/list-empty.component';

/**
 * A list as a grid of cards on every screen (the gallery's images): each
 * row group's cards under its header, without column headings (the filters
 * have a Sort by field instead).
 */
@Component({
	selector: 'app-list-grid',
	templateUrl: './list-grid.component.html',
	styleUrl: './list-grid.component.scss',
	imports: [ListEmptyComponent, RowGroupComponent]
})
export class ListGridComponent {
	protected readonly store = inject(EditorListStore);
}
