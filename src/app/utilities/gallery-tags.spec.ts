import { normalizeTag, toTagsQuery } from './gallery-tags';

describe('gallery tags', () => {
	it('normalises a tag to trimmed lowercase', () => {
		expect(normalizeTag('  Night ')).toBe('night');
	});

	it('sends tags normalised, unique, sorted, and comma-separated', () => {
		expect(toTagsQuery(['Spawn', 'night', ' spawn', ''])).toBe(
			'night,spawn'
		);
	});
});
