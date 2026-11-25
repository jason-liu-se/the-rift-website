import { ParamMap, Params } from '@angular/router';
import { ListFilters, NO_FILTERS } from './list-filters/list-filters.component';

/**
 * The list's filters and page in the URL's query parameters, so they're still
 * set after reloading or going Back.
 */
export const LIST_PARAMS = {
	search: 'search',
	searchFields: 'in',
	status: 'status',
	collection: 'collection',
	scope: 'by',
	/** 1-based, as people read it. */
	page: 'page'
} as const;

/** The filters and page a URL sets; anything missing or invalid is the default. */
export function fromListParams(params: ParamMap): {
	filters: ListFilters;
	pageIndex: number;
} {
	const page = Number(params.get(LIST_PARAMS.page));
	const searchFields = params.get(LIST_PARAMS.searchFields);
	return {
		filters: {
			search: params.get(LIST_PARAMS.search) ?? NO_FILTERS.search,
			searchFields: searchFields ? searchFields.split(',') : [],
			status: params.get(LIST_PARAMS.status) ?? NO_FILTERS.status,
			collection:
				params.get(LIST_PARAMS.collection) ?? NO_FILTERS.collection,
			scope: params.get(LIST_PARAMS.scope) === 'mine' ? 'mine' : 'all'
		},
		pageIndex: Number.isInteger(page) && page > 1 ? page - 1 : 0
	};
}

/**
 * The query parameters for the filters and page, `null` for each default so
 * merging them into the URL removes it.
 */
export function toListParams(filters: ListFilters, pageIndex: number): Params {
	const orNull = (value: string) => value || null;
	return {
		[LIST_PARAMS.search]: orNull(filters.search),
		[LIST_PARAMS.searchFields]: orNull(filters.searchFields.join(',')),
		[LIST_PARAMS.status]: orNull(filters.status),
		[LIST_PARAMS.collection]: orNull(filters.collection),
		[LIST_PARAMS.scope]: filters.scope === 'mine' ? 'mine' : null,
		[LIST_PARAMS.page]: pageIndex > 0 ? String(pageIndex + 1) : null
	};
}
