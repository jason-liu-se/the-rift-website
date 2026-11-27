import { UNDO_GROUP_MS } from 'src/app/core/config/admin';
import { FieldHistory } from './field-history';

describe('FieldHistory', () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it('undoes and redoes a step', () => {
		const history = new FieldHistory<{ title: string }>();
		history.record({ title: 'a' }, ['title']);

		expect(history.undo({ title: 'b' })).toEqual({ title: 'a' });
		expect(history.redo({ title: 'a' })).toEqual({ title: 'b' });
	});

	it('groups quick changes to the same fields into one step', () => {
		const history = new FieldHistory<{ title: string }>();
		history.record({ title: '' }, ['title']);
		vi.advanceTimersByTime(UNDO_GROUP_MS / 2);
		history.record({ title: 'a' }, ['title']);

		expect(history.undo({ title: 'ab' })).toEqual({ title: '' });
		expect(history.canUndo()).toBe(false);
	});

	it('starts a new step after a pause or for other fields', () => {
		const history = new FieldHistory<{ title?: string; slug?: string }>();
		history.record({}, ['title']);
		vi.advanceTimersByTime(UNDO_GROUP_MS);
		history.record({ title: 'a' }, ['title']);
		history.record({ title: 'ab' }, ['slug']);

		expect(history.undo({ title: 'ab', slug: 's' })).toEqual({
			title: 'ab'
		});
		expect(history.undo({ title: 'ab' })).toEqual({ title: 'a' });
		expect(history.undo({ title: 'a' })).toEqual({});
	});
});
