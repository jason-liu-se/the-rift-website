import {
	SortColumn,
	currentSort,
	sortByColumn,
	toQuerySort
} from './list-sort';

const TITLE: SortColumn = { label: 'Post', sort: 'title', firstOrder: 'asc' };
const DATE: SortColumn = { label: 'Date', sort: 'date', firstOrder: 'desc' };
const UPDATED: SortColumn = {
	label: 'Updated',
	sort: 'updatedAt',
	firstOrder: 'desc'
};
const COLUMNS = [TITLE, DATE, UPDATED];
const DEFAULT_SORT = { sort: 'updatedAt', order: 'desc' } as const;

describe('currentSort', () => {
	it.each([
		{ case: 'nothing chosen', params: {}, sort: DEFAULT_SORT },
		{
			case: 'a column, in its first direction',
			params: { sort: 'date' },
			sort: { sort: 'date', order: 'desc' }
		},
		{
			case: 'a column, reversed',
			params: { sort: 'title', order: 'desc' },
			sort: { sort: 'title', order: 'desc' }
		},
		{
			case: 'an unknown column, as the default',
			params: { sort: 'nope', order: 'asc' },
			sort: DEFAULT_SORT
		},
		{
			case: 'an invalid order, as the first direction',
			params: { sort: 'title', order: 'up' },
			sort: { sort: 'title', order: 'asc' }
		}
	])('reads $case', ({ params, sort }) => {
		expect(
			currentSort(
				{ sort: '', order: '', ...params },
				COLUMNS,
				DEFAULT_SORT
			)
		).toEqual(sort);
	});
});

describe('sortByColumn', () => {
	it('sorts a new column in its first direction', () => {
		expect(sortByColumn(DEFAULT_SORT, DATE, DEFAULT_SORT)).toEqual({
			sort: 'date',
			order: 'desc'
		});
	});

	it('reverses the current column', () => {
		expect(
			sortByColumn({ sort: 'title', order: 'asc' }, TITLE, DEFAULT_SORT)
		).toEqual({ sort: 'title', order: 'desc' });
	});

	it('leaves the URL for the default order', () => {
		expect(
			sortByColumn({ sort: 'title', order: 'asc' }, UPDATED, DEFAULT_SORT)
		).toEqual({ sort: '', order: '' });
	});
});

describe('toQuerySort', () => {
	it('sorts every field in the one direction', () => {
		expect(
			toQuerySort({ sort: 'collection,sortOrder,title', order: 'desc' })
		).toEqual({
			sort: 'collection,sortOrder,title',
			order: 'desc,desc,desc'
		});
	});
});
