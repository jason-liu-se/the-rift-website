import { convertToParamMap } from '@angular/router';
import {
	COLLECTION_FILTER,
	CREATED_BY_FILTER,
	NO_FILTERS,
	statusFilter
} from './list-filter-fields';
import { fromListParams, toListParams } from './list-params';

const FIELDS = [statusFilter(['hidden']), COLLECTION_FILTER, CREATED_BY_FILTER];

describe('list params', () => {
	const filters = {
		search: 'spawn',
		searchFields: ['title', 'content'],
		sort: 'title',
		order: 'desc',
		values: { status: 'hidden', collection: 'season5', by: 'mine' }
	};

	it('round-trips the filters and page through the URL', () => {
		const params = toListParams(filters, 2, FIELDS);

		expect(params).toEqual({
			search: 'spawn',
			in: 'title,content',
			status: 'hidden',
			collection: 'season5',
			by: 'mine',
			sort: 'title',
			order: 'desc',
			page: '3'
		});
		expect(fromListParams(convertToParamMap(params), FIELDS)).toEqual({
			filters,
			pageIndex: 2
		});
	});

	it('removes defaults from the URL (null), and reads a bare URL as defaults', () => {
		expect(Object.values(toListParams(NO_FILTERS, 0, FIELDS))).toEqual(
			Array(8).fill(null)
		);
		expect(fromListParams(convertToParamMap({}), FIELDS)).toEqual({
			filters: NO_FILTERS,
			pageIndex: 0
		});
	});

	it("ignores an invalid page, a value that isn't an option, and another type's filter", () => {
		const { filters: read, pageIndex } = fromListParams(
			convertToParamMap({ page: 'x', by: 'everyone', collection: 's5' }),
			[CREATED_BY_FILTER]
		);

		expect(pageIndex).toBe(0);
		expect(read.values).toEqual({});
	});
});
