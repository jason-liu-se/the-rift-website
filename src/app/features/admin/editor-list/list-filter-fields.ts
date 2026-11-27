import { EditorContentType } from 'src/app/core/api/api-requests';
import { DraftSummary } from 'src/app/core/api/api-responses';
import { ListQueryOf } from 'src/app/features/admin/editor-content/editor-content-types';
import {
	ItemStatus,
	STATUS_LABELS,
	UNPUBLISHED_CHANGES
} from '../status-badge/status-badge';

type ListQuery = ListQueryOf<EditorContentType>;

/** A choice in a filter: what's sent, and what the editor sees. */
export interface FilterOption {
	value: string;
	label: string;
}

/** An admin list's filters, as the editor set them. */
export interface ListFilterSettings {
	search: string;
	/** The fields `search` looks in; none means every field. */
	searchFields: string[];
	/** A sort column's `sort`, or '' for the type's default order. */
	sort: string;
	/** `asc` or `desc`, or '' for the column's first direction. */
	order: string;
	/** Each set filter's value, by its field's `key`; unset ones are left out. */
	values: Readonly<Partial<Record<string, string>>>;
}

export const NO_FILTERS: ListFilterSettings = {
	search: '',
	searchFields: [],
	sort: '',
	order: '',
	values: {}
};

/**
 * One of a list's filters (beside search), as a choice of options. Its
 * value is '' until one is chosen.
 */
export interface ListFilterField {
	/** Its value's key in `ListFilterSettings.values`, and its URL parameter. */
	key: string;
	label: string;
	/** Fixed choices, or the type's collections. */
	options: readonly FilterOption[] | 'collections';
	/** The choice for no filter. */
	anyLabel: string;
	/** The API query for a value; undefined when no item can match (drafts only). */
	toQuery(
		value: string,
		userId: string | undefined
	): Partial<ListQuery> | undefined;
	/** Whether a draft is still listed (the API lists them all, unfiltered). */
	keepsDraft(draft: DraftSummary, value: string): boolean;
}

/** A filter field with its choices at hand, as the filters show it. */
export type ShownFilterField = Pick<
	ListFilterField,
	'key' | 'label' | 'anyLabel'
> & {
	options: readonly FilterOption[];
};

/** Status `draft` lists only the editor's unpublished changes. */
export const DRAFTS_ONLY_STATUS = 'draft';

/** A type's statuses, and its unpublished changes on their own. */
export function statusFilter(statuses: readonly ItemStatus[]): ListFilterField {
	return {
		key: 'status',
		label: 'Status',
		options: [
			...statuses.map((status) => ({
				value: status,
				label: STATUS_LABELS[status]
			})),
			{ value: DRAFTS_ONLY_STATUS, label: UNPUBLISHED_CHANGES }
		],
		anyLabel: 'Any',
		toQuery: (status) =>
			status === DRAFTS_ONLY_STATUS
				? undefined
				: { status: status as ListQuery['status'] },
		keepsDraft: (_, status) => status === DRAFTS_ONLY_STATUS
	};
}

export const COLLECTION_FILTER: ListFilterField = {
	key: 'collection',
	label: 'Collection',
	options: 'collections',
	anyLabel: 'Any',
	toQuery: (collection) => ({ collection }),
	keepsDraft: (draft, collection) =>
		(draft.fields as { collection?: string }).collection === collection
};

/** The editor made every draft listed, so "Me" keeps them all. */
export const CREATED_BY_FILTER: ListFilterField = {
	key: 'by',
	label: 'Created by',
	options: [{ value: 'mine', label: 'Me' }],
	anyLabel: 'Anyone',
	toQuery: (_, userId) => (userId ? { createdBy: userId } : {}),
	keepsDraft: () => true
};

/** How many filters are set (search fields count as one, search as none). */
export function countSetFilters({
	values,
	searchFields
}: ListFilterSettings): number {
	return Object.keys(values).length + (searchFields.length > 0 ? 1 : 0);
}
