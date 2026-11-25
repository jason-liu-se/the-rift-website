import { DraftSummary } from 'src/app/interfaces/api-responses';
import { NO_FILTERS } from './list-filters/list-filters.component';
import { filterDrafts, toDraftRow, toListQuery } from './list-rows';

const DRAFTS = [
	{ id: 'a', type: 'news', fields: { title: 'Spawn **update**' } },
	{ id: 'b', type: 'news', fields: { title: 'Event night' } },
	{ id: 'c', type: 'news', fields: {} },
	{ id: 'd', type: 'gallery', fields: { collection: 'season5' } }
] as DraftSummary[];

describe('filterDrafts', () => {
	it.each([
		{ case: 'no filters', filters: {}, ids: ['a', 'b', 'c', 'd'] },
		{
			case: 'the Draft status',
			filters: { status: 'draft' },
			ids: ['a', 'b', 'c', 'd']
		},
		{ case: 'a published status', filters: { status: 'live' }, ids: [] },
		{
			case: 'a search, by plain-text name',
			filters: { search: ' spawn update ' },
			ids: ['a']
		},
		{
			case: 'a search for an untitled one',
			filters: { search: 'untitled' },
			ids: ['c', 'd']
		},
		{
			case: '"Created by me"',
			filters: { scope: 'mine' as const },
			ids: ['a', 'b', 'c', 'd']
		},
		{
			case: 'a collection',
			filters: { collection: 'season5' },
			ids: ['d']
		}
	])('keeps the right drafts for $case', ({ filters, ids }) => {
		expect(
			filterDrafts(DRAFTS, { ...NO_FILTERS, ...filters }).map(
				({ id }) => id
			)
		).toEqual(ids);
	});
});

const DEFAULT_SORT = { sort: 'updatedAt', order: 'desc' } as const;

describe('toListQuery', () => {
	it.each([
		{ case: 'no filters', filters: {}, search: '', query: DEFAULT_SORT },
		{
			case: 'the Draft status (no items)',
			filters: { status: 'draft' },
			search: '',
			query: undefined
		},
		{
			case: 'every filter',
			filters: {
				status: 'hidden',
				collection: 'season5',
				scope: 'mine' as const,
				searchFields: ['title', 'content']
			},
			search: ' night ',
			query: {
				...DEFAULT_SORT,
				status: 'hidden',
				collection: 'season5',
				createdBy: 'me',
				q: 'night',
				in: 'title,content'
			}
		},
		{
			case: 'search fields without a search',
			filters: { searchFields: ['title'] },
			search: '  ',
			query: DEFAULT_SORT
		}
	])('sends $case', ({ filters, search, query }) => {
		expect(
			toListQuery(
				{ ...NO_FILTERS, ...filters },
				search,
				'me',
				DEFAULT_SORT
			)
		).toEqual(query);
	});
});

describe('toDraftRow', () => {
	const POST = { id: 'post-1', date: '2026-01-01T00:00:00.000Z' };

	it.each([
		{ case: 'a new post', target: undefined, date: 'now' },
		{
			case: 'a scheduled post',
			target: undefined,
			date: '2027-01-01T00:00:00.000Z',
			own: true
		},
		{ case: 'an edit', target: POST, date: POST.date },
		{
			case: "an edit of a post that isn't loaded",
			target: undefined,
			date: undefined
		}
	])("shows $case's post date", ({ target, date, own }) => {
		const draft = {
			id: 'd',
			type: 'news',
			fields: { title: 'Hi', ...(own && { date }) },
			...(target || date === undefined
				? { target: { id: 'post-1', startingRevision: 1 } }
				: {})
		} as DraftSummary;

		expect(toDraftRow(draft, target as never).cellItem).toEqual({
			title: 'Hi',
			date
		});
	});
});
