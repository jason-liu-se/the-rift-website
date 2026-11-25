import { convertToParamMap } from '@angular/router';
import { NO_FILTERS } from './list-filters/list-filters.component';
import { fromListParams, toListParams } from './list-params';

describe('list params', () => {
	const filters = {
		search: 'spawn',
		searchFields: ['title', 'content'],
		status: 'hidden',
		collection: 'season5',
		scope: 'mine' as const
	};

	it('round-trips the filters and page through the URL', () => {
		const params = toListParams(filters, 2);

		expect(params).toEqual({
			search: 'spawn',
			in: 'title,content',
			status: 'hidden',
			collection: 'season5',
			by: 'mine',
			page: '3'
		});
		expect(fromListParams(convertToParamMap(params))).toEqual({
			filters,
			pageIndex: 2
		});
	});

	it('removes defaults from the URL (null), and reads a bare URL as defaults', () => {
		expect(Object.values(toListParams(NO_FILTERS, 0))).toEqual(
			Array(6).fill(null)
		);
		expect(fromListParams(convertToParamMap({}))).toEqual({
			filters: NO_FILTERS,
			pageIndex: 0
		});
	});

	it('ignores an invalid page or scope', () => {
		const { filters: read, pageIndex } = fromListParams(
			convertToParamMap({ page: 'x', by: 'everyone' })
		);

		expect(pageIndex).toBe(0);
		expect(read.scope).toBe('all');
	});
});
