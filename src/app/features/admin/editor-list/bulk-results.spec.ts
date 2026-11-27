import { BulkItemResult } from 'src/app/core/api/api-responses';
import { countItems, summarizeBulkResults, toChunks } from './bulk-results';

const NOUN = { one: 'post', many: 'posts' };
const ok = (id: string): BulkItemResult<unknown> => ({ id, outcome: 'ok' });

describe('bulk results', () => {
	it('counts items with the right noun', () => {
		expect(countItems(1, NOUN)).toBe('1 post');
		expect(countItems(0, NOUN)).toBe('0 posts');
	});

	it('says what was done when everything worked', () => {
		expect(summarizeBulkResults('hide', [ok('a'), ok('b')], NOUN)).toEqual({
			message: 'Hid 2 posts.',
			hasFailures: false
		});
	});

	it('sums up every failure in one message, grouped by why', () => {
		const results: BulkItemResult<unknown>[] = [
			ok('a'),
			{ id: 'b', outcome: 'conflict', current: {} },
			{ id: 'c', outcome: 'not-found' },
			{ id: 'd', outcome: 'not-found' },
			{ id: 'e', outcome: 'invalid', reason: 'tags: too many' },
			{ id: 'f', outcome: 'invalid', reason: 'tags: too many' }
		];

		expect(summarizeBulkResults('add-tags', results, NOUN)).toEqual({
			message:
				"Tagged 1 post. 5 weren't: 1 changed since you loaded it (reload and try again), 2 no longer exist, 2 invalid (tags: too many).",
			hasFailures: true
		});
	});

	it('splits items into chunks of at most the given size', () => {
		expect(toChunks([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
		expect(toChunks([], 2)).toEqual([]);
	});
});
