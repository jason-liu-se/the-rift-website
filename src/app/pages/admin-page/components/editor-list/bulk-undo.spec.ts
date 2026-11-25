import { BulkItemResult } from 'src/app/interfaces/api-responses';
import {
	UndoableAction,
	UndoableItem,
	toUndoSteps,
	wouldChange
} from './bulk-undo';

const item = (
	id: string,
	changes: Partial<UndoableItem> = {}
): UndoableItem => ({ id, revision: 1, visible: true, ...changes });

/** Each item as the API answers it once changed: one revision on. */
const ok = (items: UndoableItem[]): BulkItemResult<UndoableItem>[] =>
	items.map((original) => ({
		id: original.id,
		outcome: 'ok',
		item: { ...original, revision: original.revision + 1 }
	}));

const ref = (id: string) => ({ id, startingRevision: 2 });

describe('wouldChange', () => {
	it.each<[string, UndoableAction, Partial<UndoableItem>, boolean]>([
		['show, hidden', { action: 'show' }, { visible: false }, true],
		['show, visible', { action: 'show' }, {}, false],
		['hide, visible', { action: 'hide' }, {}, true],
		[
			'move, elsewhere',
			{ action: 'move', collection: 'b' },
			{ collection: 'a' },
			true
		],
		[
			'move, already there',
			{ action: 'move', collection: 'a' },
			{ collection: 'a' },
			false
		],
		[
			'add tags, one missing',
			{ action: 'add-tags', tags: ['x', 'y'] },
			{ tags: ['x'] },
			true
		],
		[
			'add tags, all there',
			{ action: 'add-tags', tags: ['x'] },
			{ tags: ['x'] },
			false
		],
		[
			'remove tags, none there',
			{ action: 'remove-tags', tags: ['x'] },
			{},
			false
		]
	])('%s: %s', (_, action, changes, expected) => {
		expect(wouldChange(action, item('a', changes))).toBe(expected);
	});
});

describe('toUndoSteps', () => {
	it('shows again what was hidden, at the new revisions', () => {
		const items = [item('a'), item('b')];
		const before = new Map(items.map((each) => [each.id, each]));

		expect(toUndoSteps({ action: 'hide' }, before, ok(items))).toEqual([
			{ action: 'show', items: [ref('a'), ref('b')] }
		]);
	});

	it('moves each item back to its own collection, one update per collection', () => {
		const items = [
			item('a', { collection: 's5' }),
			item('b', { collection: 's6' }),
			item('c', { collection: 's5' })
		];
		const before = new Map(items.map((each) => [each.id, each]));

		expect(
			toUndoSteps({ action: 'move', collection: 's7' }, before, ok(items))
		).toEqual([
			{ action: 'move', collection: 's5', items: [ref('a'), ref('c')] },
			{ action: 'move', collection: 's6', items: [ref('b')] }
		]);
	});

	it("removes only the tags an item didn't have before", () => {
		const items = [
			item('a', { tags: [] }),
			item('b', { tags: ['spawn'] }),
			item('c', { tags: [] })
		];
		const before = new Map(items.map((each) => [each.id, each]));

		expect(
			toUndoSteps(
				{ action: 'add-tags', tags: ['spawn', 'night'] },
				before,
				ok(items)
			)
		).toEqual([
			{
				action: 'remove-tags',
				tags: ['spawn', 'night'],
				items: [ref('a'), ref('c')]
			},
			{ action: 'remove-tags', tags: ['night'], items: [ref('b')] }
		]);
	});

	it('re-adds only the tags an item had', () => {
		const items = [item('a', { tags: ['spawn'] }), item('b', { tags: [] })];
		const before = new Map(items.map((each) => [each.id, each]));

		expect(
			toUndoSteps(
				{ action: 'remove-tags', tags: ['spawn'] },
				before,
				ok(items)
			)
		).toEqual([{ action: 'add-tags', tags: ['spawn'], items: [ref('a')] }]);
	});

	it('leaves out items that failed', () => {
		const items = [item('a')];
		const before = new Map(items.map((each) => [each.id, each]));

		expect(
			toUndoSteps({ action: 'hide' }, before, [
				{ id: 'a', outcome: 'conflict' } as BulkItemResult<UndoableItem>
			])
		).toEqual([]);
	});
});
