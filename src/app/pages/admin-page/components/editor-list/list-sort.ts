export type SortDirection = 'asc' | 'desc';

/** A list's order: the API's `sort` fields, all in one direction. */
export interface ListSort {
	sort: string;
	order: SortDirection;
}

/** A column the list can be sorted by, from its heading. */
export interface SortColumn {
	label: string;
	/** The API's `sort` (fields, comma-separated); also its value in the URL. */
	sort: string;
	/** The direction it sorts in first: newest first for dates. */
	firstOrder: SortDirection;
}

/**
 * The order the URL's `sort` and `order` choose: a column's, in its first
 * direction unless `order` says otherwise, or else the default.
 */
export function currentSort(
	{ sort, order }: { sort: string; order: string },
	columns: readonly SortColumn[],
	defaultSort: ListSort
): ListSort {
	const column = columns.find((each) => each.sort === sort);
	if (!column) {
		return defaultSort;
	}
	return {
		sort: column.sort,
		order: order === 'asc' || order === 'desc' ? order : column.firstOrder
	};
}

/**
 * Choosing a column: the other direction if it's the current one, else its
 * first. As the URL's values: empty for the default order.
 */
export function sortByColumn(
	current: ListSort,
	column: SortColumn,
	defaultSort: ListSort
): { sort: string; order: string } {
	const order =
		current.sort === column.sort
			? current.order === 'asc'
				? 'desc'
				: 'asc'
			: column.firstOrder;
	return toSortParams({ sort: column.sort, order }, defaultSort);
}

/** A sort as the URL's values: empty for the default order. */
export function toSortParams(
	sort: ListSort,
	defaultSort: ListSort
): { sort: string; order: string } {
	return sort.sort === defaultSort.sort && sort.order === defaultSort.order
		? { sort: '', order: '' }
		: sort;
}

/** The API's `sort` and `order`: the direction for each field. */
export function toQuerySort({ sort, order }: ListSort): {
	sort: string;
	order: string;
} {
	return {
		sort,
		order: sort
			.split(',')
			.map(() => order)
			.join(',')
	};
}
