import {
	BulkItemRef,
	EditorContentType,
	NewsDraftOptions
} from 'src/app/interfaces/api-requests';
import { DraftSummary } from 'src/app/interfaces/api-responses';
import {
	ListQueryOf,
	SummaryOf
} from 'src/app/services/editor-content/editor-content-types';
import { itemName } from './item-name';
import { ListFilters } from './list-filters/list-filters.component';
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
			/** The editor has an unpublished edit of it. */
			hasDraft: boolean;
	  }
	| {
			kind: 'draft';
			id: string;
			name: string;
			draft: DraftSummary;
			/** An edit of a published item, rather than a new one. */
			isEdit: boolean;
			/** What the type's cells show of it (they take an `item`). */
			cellItem: object;
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
		hasDraft
	};
}

/** `published`: the item an edit draft is of, if it's loaded. */
export function toDraftRow(draft: DraftSummary, published?: Item): DraftRow {
	return {
		kind: 'draft',
		id: draft.id,
		name: itemName(draft.fields),
		draft,
		isEdit: !!draft.target,
		cellItem: toDraftCellItem(draft, published)
	};
}

/**
 * A draft as the type's cells show it: its fields so far, a season's
 * dimension count, and a news post's date: the draft's own if it has one,
 * else "now" for a new post, or the post's own for an edit (which keeps it).
 */
function toDraftCellItem(draft: DraftSummary, published?: Item): object {
	return {
		...draft.fields,
		...(draft.type === 'maps' && {
			dimensionCount: draft.dimensionCount
		}),
		...(draft.type === 'news' && {
			date:
				(draft.fields as NewsDraftOptions).date ??
				(draft.target
					? (published as { date?: string } | undefined)?.date
					: 'now')
		})
	};
}

/**
 * The drafts the filters keep, filtered here (the API lists them all): none
 * for a published status, and those whose name matches the search. The
 * editor made every one, so "Created by" keeps them all. A collection
 * filter keeps those in it.
 */
export function filterDrafts(
	drafts: readonly DraftSummary[],
	{ status, search, collection }: ListFilters
): DraftSummary[] {
	if (status && status !== 'draft') {
		return [];
	}
	const words = search.trim().toLowerCase();
	return drafts.filter(
		(draft) =>
			itemName(draft.fields).toLowerCase().includes(words) &&
			(!collection ||
				(draft.fields as { collection?: string }).collection ===
					collection)
	);
}

/**
 * The API query for the filters; undefined when only drafts are wanted. An
 * order is the one the filters chose (see `currentSort`).
 */
export function toListQuery(
	{ scope, status, collection, searchFields }: ListFilters,
	search: string,
	userId: string | undefined,
	sort: ListSort
): ListQueryOf<EditorContentType> | undefined {
	if (status === 'draft') {
		return undefined;
	}
	const words = search.trim();
	return {
		...toQuerySort(sort),
		...(status && {
			status: status as ListQueryOf<EditorContentType>['status']
		}),
		...(collection && { collection }),
		...(scope === 'mine' && userId && { createdBy: userId }),
		...(words && { q: words }),
		...(words && searchFields.length > 0 && { in: searchFields.join(',') })
	};
}
