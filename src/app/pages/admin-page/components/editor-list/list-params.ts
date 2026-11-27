import { ParamMap, Params } from '@angular/router';
import { ListFilterField, ListFilters } from './list-filter-fields';

/**
 * The list's search, sort, and page in the URL's query parameters, beside
 * each filter's (its `key`), so they're still set after reloading or going
 * Back.
 */
export const LIST_PARAMS = {
	search: 'search',
	searchFields: 'in',
	sort: 'sort',
	order: 'order',
	/** 1-based, as people read it. */
	page: 'page'
} as const;

/**
 * The filters and page a URL sets; anything missing or invalid is the
 * default (a filter's value must be one of its options).
 */
export function fromListParams(
	params: ParamMap,
	fields: readonly ListFilterField[]
): { filters: ListFilters; pageIndex: number } {
	const page = Number(params.get(LIST_PARAMS.page));
	const searchFields = params.get(LIST_PARAMS.searchFields);
	const values = fields.flatMap(({ key, options }) => {
		const value = params.get(key);
		const isValid =
			!!value &&
			(options === 'collections' ||
				options.some((option) => option.value === value));
		return isValid ? [[key, value] as const] : [];
	});
	return {
		filters: {
			search: params.get(LIST_PARAMS.search) ?? '',
			searchFields: searchFields ? searchFields.split(',') : [],
			sort: params.get(LIST_PARAMS.sort) ?? '',
			order: params.get(LIST_PARAMS.order) ?? '',
			values: Object.fromEntries(values)
		},
		pageIndex: Number.isInteger(page) && page > 1 ? page - 1 : 0
	};
}

/**
 * The query parameters for the filters and page, `null` for each default so
 * merging them into the URL removes it.
 */
export function toListParams(
	filters: ListFilters,
	pageIndex: number,
	fields: readonly ListFilterField[]
): Params {
	const orNull = (value: string | undefined) => value || null;
	return {
		[LIST_PARAMS.search]: orNull(filters.search),
		[LIST_PARAMS.searchFields]: orNull(filters.searchFields.join(',')),
		...Object.fromEntries(
			fields.map(({ key }) => [key, orNull(filters.values[key])])
		),
		[LIST_PARAMS.sort]: orNull(filters.sort),
		[LIST_PARAMS.order]: orNull(filters.order),
		[LIST_PARAMS.page]: pageIndex > 0 ? String(pageIndex + 1) : null
	};
}
