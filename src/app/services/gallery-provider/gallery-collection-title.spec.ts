import { galleryCollectionTitle } from './gallery-collection-title';

describe('galleryCollectionTitle', () => {
	it.each([
		['season5', 'Season 5'],
		['season12', 'Season 12'],
		['season-5', 'Season 5'],
		['builds', 'Builds'],
		['spawn_builds', 'Spawn builds']
	])('turns %s into %s', (name, title) => {
		expect(galleryCollectionTitle(name)).toBe(title);
	});
});
