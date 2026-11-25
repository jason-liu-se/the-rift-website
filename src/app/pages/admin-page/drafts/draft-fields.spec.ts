import {
	findMissingFields,
	isEmptyDraft,
	isSameFields,
	pickFields
} from './draft-fields';

describe('draft fields', () => {
	it("picks a type's own fields and visibility, leaving out blank ones", () => {
		expect(
			pickFields('news', {
				id: 'x',
				title: 'Hi',
				content: '',
				imageUrl: undefined,
				visible: false,
				revision: 3
			})
		).toEqual({ title: 'Hi', visible: false });
	});

	it('treats blank fields as empty, whatever its visibility', () => {
		expect(
			isEmptyDraft({
				title: ' ',
				tags: [],
				imageUrl: null,
				visible: false
			})
		).toBe(true);
		expect(isEmptyDraft({ title: 'a' })).toBe(false);
	});

	it('compares fields ignoring blanks and key order', () => {
		expect(
			isSameFields(
				{ title: 'a', content: 'b', imageUrl: '' },
				{ content: 'b', title: 'a' }
			)
		).toBe(true);
		expect(isSameFields({ title: 'a' }, { title: 'b' })).toBe(false);
	});
});

describe('findMissingFields', () => {
	it.each([
		{ fields: {}, missing: ['title', 'content'] },
		{ fields: { title: '  ', content: 'Body' }, missing: ['title'] },
		{ fields: { title: 'Hi', content: 'Body' }, missing: [] }
	])('finds $missing missing in $fields', ({ fields, missing }) => {
		expect(findMissingFields(fields, ['title', 'content'])).toEqual(
			missing
		);
	});
});
