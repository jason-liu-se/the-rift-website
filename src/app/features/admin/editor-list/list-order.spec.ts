import { toOrderUpdates } from './list-order';

describe('toOrderUpdates', () => {
	it('numbers the items from 0, sending only those that change', () => {
		expect(
			toOrderUpdates([
				{ id: 'b', revision: 3, sortOrder: 1 },
				{ id: 'a', revision: 5, sortOrder: 0 },
				{ id: 'c', revision: 2, sortOrder: 2 }
			])
		).toEqual([
			{ id: 'b', startingRevision: 3, sortOrder: 0 },
			{ id: 'a', startingRevision: 5, sortOrder: 1 }
		]);
	});

	it('numbers items that had no position', () => {
		expect(
			toOrderUpdates([
				{ id: 'a', revision: 1, sortOrder: 0 },
				{ id: 'b', revision: 1, sortOrder: null }
			])
		).toEqual([{ id: 'b', startingRevision: 1, sortOrder: 1 }]);
	});
});
