import { isEmptyDraft, isSameFields, pickFields } from './draft-fields';

describe('draft fields', () => {
	it("picks a type's own fields, leaving out blank ones", () => {
		expect(
			pickFields('news', {
				id: 'x',
				title: 'Hi',
				content: '',
				imageUrl: undefined,
				revision: 3
			})
		).toEqual({ title: 'Hi' });
	});

	it('treats blank fields as empty', () => {
		expect(isEmptyDraft({ title: ' ', tags: [], imageUrl: null })).toBe(
			true
		);
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
