import {
	BulkImageRow,
	captionFromFileName,
	findRowProblem,
	parsePastedLinks,
	toCreateRequest
} from './bulk-image-rows';

const ROW: BulkImageRow = {
	id: 'row-1',
	previewUrl: 'https://i.ibb.co/a/x.png',
	imageUrl: 'https://i.ibb.co/a/x.png',
	caption: ' Spawn ',
	collection: 'season5',
	tags: ['spawn'],
	isVisible: false
};

describe('bulk image rows', () => {
	it.each([
		['spawn_walkway-1.png', 'Spawn walkway 1'],
		['IMG 2024.final.jpeg', 'IMG 2024.final'],
		['--x--.webp', 'X']
	])('makes a caption from %s', (fileName, caption) => {
		expect(captionFromFileName(fileName)).toBe(caption);
	});

	it('reads pasted links one per line', () => {
		expect(parsePastedLinks(' https://a\n\nhttps://b https://c ')).toEqual([
			'https://a',
			'https://b',
			'https://c'
		]);
	});

	it('says why a row cannot be published', () => {
		expect(findRowProblem(ROW)).toBeUndefined();
		expect(findRowProblem({ ...ROW, collection: '' })).toBe(
			'Choose a collection.'
		);
		expect(findRowProblem({ ...ROW, caption: ' ' })).toBe('Add a caption.');
		expect(
			findRowProblem({ ...ROW, imageUrl: 'https://example.com/x.png' })
		).toBe("This link isn't from imgbb or imgur.");
	});

	it('creates with its row ID as the createId', () => {
		expect(toCreateRequest(ROW)).toEqual({
			createId: 'row-1',
			collection: 'season5',
			caption: 'Spawn',
			imageUrl: 'https://i.ibb.co/a/x.png',
			tags: ['spawn'],
			visible: false
		});
	});
});
