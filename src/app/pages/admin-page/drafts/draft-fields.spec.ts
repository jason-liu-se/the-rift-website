import {
	findMissingFields,
	isEmptyDraft,
	isSameFields,
	pickDraftFields,
	pickItemFields
} from './draft-fields';

describe('draft fields', () => {
	const news = {
		id: 'x',
		title: 'Hi',
		content: '',
		imageUrl: undefined,
		visible: false,
		date: '2026-01-01T12:00:00.000Z',
		revision: 3
	};

	it("picks a draft's fields and options, leaving out blank ones", () => {
		expect(pickDraftFields('news', news)).toEqual({
			title: 'Hi',
			visible: false,
			date: news.date
		});
	});

	it("picks an item's fields and visibility, but not its date (kept by leaving it out)", () => {
		expect(pickItemFields('news', news)).toEqual({
			title: 'Hi',
			visible: false
		});
	});

	it('treats blank fields as empty, whatever its options', () => {
		expect(
			isEmptyDraft({
				title: ' ',
				tags: [],
				imageUrl: null,
				visible: false,
				date: 'now'
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
