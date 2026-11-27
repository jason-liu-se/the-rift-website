import { BulkItemRef, EditorContentType } from 'src/app/core/api/api-requests';
import { DraftSummary, EditorRef } from 'src/app/core/api/api-responses';
import {
	ListQueryOf,
	SummaryOf
} from 'src/app/features/admin/editor-content/editor-content-types';
import { EDITOR_TYPES } from '../editor-type-configs';
import { itemName } from './item-name';
import { RowData } from './list-columns';
import { ListFilterField, ListFilterSettings } from './list-filter-fields';
import { ListSort, toQuerySort } from './list-sort';

type Item = SummaryOf<EditorContentType>;

/** One row of an admin list: a published item or one of the editor's drafts. */
export type ListRow =
	| {
			kind: 'item';
			id: string;
			name: string;
			item: Item;
			ref: BulkItemRef;
			data: RowData;
	  }
	| {
			kind: 'draft';
			id: string;
			name: string;
			draft: DraftSummary;
			data: RowData;
	  };

export type ItemRow = Extract<ListRow, { kind: 'item' }>;
export type DraftRow = Extract<ListRow, { kind: 'draft' }>;

export function toItemRow(item: Item, hasDraft: boolean): ItemRow {
	return {
		kind: 'item',
		id: item.id,
		name: itemName(item),
		item,
		ref: { id: item.id, startingRevision: item.revision },
		data: {
			fields: item,
			status: item.status,
			hasDraft,
			updatedBy: item.lastUpdatedBy,
			updatedAt: item.updatedAt
		}
	};
}

/**
 * `published`: the item an edit draft is of, if it's loaded. `editor`: who's
 * listing it, who made every draft listed.
 */
export function toDraftRow(
	draft: DraftSummary,
	published?: Item,
	editor?: Pick<EditorRef, 'username' | 'avatarUrl'>
): DraftRow {
	return {
		kind: 'draft',
		id: draft.id,
		name: itemName(draft.fields),
		draft,
		data: {
			fields: toDraftFields(draft, published),
			// An edit of a published item, or a new one.
			status: draft.target ? 'edit' : 'draft',
			hasDraft: false,
			updatedBy: editor,
			updatedAt: draft.updatedAt
		}
	};
}

/**
 * A draft's fields as the cells show them: its fields so far (a cleared one,
 * null, as unset), and what its type adds (`draftRowFields`).
 */
function toDraftFields(
	draft: DraftSummary,
	published?: Item
): RowData['fields'] {
	const fields = Object.entries(draft.fields).filter(
		([, value]) => value !== null
	);
	return {
		...Object.fromEntries(fields),
		...EDITOR_TYPES[draft.type as EditorContentType].draftRowFields?.(
			draft,
			published
		)
	};
}

/**
 * The drafts the filters keep, filtered here (the API lists them all): those
 * whose name matches the search, and that every set filter keeps.
 */
export function filterDrafts(
	drafts: readonly DraftSummary[],
	{ search, values }: ListFilterSettings,
	fields: readonly ListFilterField[]
): DraftSummary[] {
	const words = search.trim().toLowerCase();
	return drafts.filter(
		(draft) =>
			itemName(draft.fields).toLowerCase().includes(words) &&
			fields.every(
				({ key, keepsDraft }) =>
					!values[key] || keepsDraft(draft, values[key])
			)
	);
}

/**
 * The API query for the filters; undefined when only drafts are wanted. An
 * order is the one the filters chose (see `currentSort`).
 */
export function toListQuery(
	{ searchFields, values }: ListFilterSettings,
	search: string,
	userId: string | undefined,
	sort: ListSort,
	fields: readonly ListFilterField[]
): ListQueryOf<EditorContentType> | undefined {
	const filterQueries = fields.flatMap(({ key, toQuery }) =>
		values[key] ? [toQuery(values[key], userId)] : []
	);
	if (filterQueries.includes(undefined)) {
		return undefined;
	}
	const words = search.trim();
	return Object.assign(
		toQuerySort(sort),
		...filterQueries,
		words && { q: words },
		words && searchFields.length > 0 && { in: searchFields.join(',') }
	);
}
