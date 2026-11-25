import {
	BulkItemRef,
	EditorContentType
} from 'src/app/interfaces/api-requests';
import { DraftSummary } from 'src/app/interfaces/api-responses';
import {
	ListQueryOf,
	SummaryOf
} from 'src/app/services/editor-content/editor-content-types';
import { itemName } from './item-name';
import { ListFilters } from './list-filters/list-filters.component';

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

export function toDraftRow(draft: DraftSummary): DraftRow {
	return {
		kind: 'draft',
		id: draft.id,
		name: itemName(draft.fields),
		draft,
		isEdit: !!draft.target
	};
}

/**
 * The drafts the filters keep, filtered here (the API lists them all): none
 * for a published status, and those whose name matches the search. The
 * editor made every one, so "Created by" keeps them all; drafts don't carry
 * a collection, so that filter doesn't apply.
 */
export function filterDrafts(
	drafts: readonly DraftSummary[],
	{ status, search }: ListFilters
): DraftSummary[] {
	if (status && status !== 'draft') {
		return [];
	}
	const words = search.trim().toLowerCase();
	return drafts.filter((draft) =>
		itemName(draft.fields).toLowerCase().includes(words)
	);
}

/** The API query for the filters; undefined when only drafts are wanted. */
export function toListQuery(
	{ scope, status, collection, searchFields }: ListFilters,
	search: string,
	userId: string | undefined
): ListQueryOf<EditorContentType> | undefined {
	if (status === 'draft') {
		return undefined;
	}
	const words = search.trim();
	return {
		...(status && {
			status: status as ListQueryOf<EditorContentType>['status']
		}),
		...(collection && { collection }),
		...(scope === 'mine' && userId && { createdBy: userId }),
		...(words && { q: words }),
		...(words && searchFields.length > 0 && { in: searchFields.join(',') })
	};
}
