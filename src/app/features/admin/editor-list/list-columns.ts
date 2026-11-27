import { Type } from '@angular/core';
import { EditorContentType } from 'src/app/core/api/api-requests';
import { EditorRef } from 'src/app/core/api/api-responses';
import { SummaryOf } from 'src/app/features/admin/editor-content/editor-content-types';
import {
	ItemStatus,
	StatusBadgeComponent
} from '../status-badge/status-badge.component';
import { UpdatedCellComponent } from './cells/updated-cell/updated-cell.component';
import { SortColumn, SortDirection } from './list-sort';

/** What a row's cells show, a published item and a draft alike. */
export interface RowData<T extends EditorContentType = EditorContentType> {
	/**
	 * A published item's summary, or a draft's fields so far (with a season's
	 * dimension count, and a news post's date: see `toDraftRow`).
	 */
	fields: Partial<SummaryOf<T>>;
	status: ItemStatus;
	/** The editor has an unpublished edit of it. */
	hasDraft: boolean;
	updatedBy?: Pick<EditorRef, 'username' | 'avatarUrl'>;
	updatedAt?: string;
}

/** What cells may need beyond the row. */
export interface CellContext {
	/** A collection's title, by its slug ('' for none). */
	collectionTitle(slug: string | undefined): string;
}

/**
 * Where a column's cell goes when a row is a card (phones, the gallery's
 * grid): `title` is the row's name, which links to its editor; `detail` a
 * smaller line below it (phones only); `badge` the status's place; `desktop`
 * only in a desktop table.
 */
export type CardPlacement = 'title' | 'detail' | 'badge' | 'desktop';

/** One of a list's columns: its heading, its cells, and how it sorts. */
export interface ListColumn<T extends EditorContentType = EditorContentType> {
	/** Unique in the list. */
	id: string;
	/** Its heading, and its name in the Sort by field. */
	label: string;
	cell: Type<unknown>;
	/** The cell's inputs, for a row. */
	inputs(row: RowData<T>, context: CellContext): Record<string, unknown>;
	/** A desktop table's column width (CSS); none takes the rest. */
	width?: string;
	/** The API's `sort` fields (comma-separated), and the direction it sorts in first. */
	sort?: { by: string; firstOrder: SortDirection };
	card: CardPlacement;
}

export const STATUS_COLUMN: ListColumn = {
	id: 'status',
	label: 'Status',
	cell: StatusBadgeComponent,
	inputs: ({ status, hasDraft }) => ({ status, hasDraft }),
	width: '11rem',
	card: 'badge'
};

export const UPDATED_COLUMN: ListColumn = {
	id: 'updated',
	label: 'Updated',
	cell: UpdatedCellComponent,
	inputs: ({ updatedBy, updatedAt }) => ({ editor: updatedBy, updatedAt }),
	width: '13rem',
	sort: { by: 'updatedAt', firstOrder: 'desc' },
	card: 'desktop'
};

/** A column's sort, if it has one, as its heading and the Sort by field use it. */
export function toSortColumn({
	label,
	sort
}: ListColumn): SortColumn | undefined {
	return sort && { label, sort: sort.by, firstOrder: sort.firstOrder };
}

/** The columns a list can be sorted by, in table order. */
export function toSortColumns(columns: readonly ListColumn[]): SortColumn[] {
	return columns.flatMap((column) => toSortColumn(column) ?? []);
}
