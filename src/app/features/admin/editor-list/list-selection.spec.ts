import { ListSelection } from './list-selection';

const ITEMS = [
	{ id: 'a', startingRevision: 1 },
	{ id: 'b', startingRevision: 2 }
];
const PAGE = { items: ITEMS, draftIds: [] };

describe('ListSelection', () => {
	let selection: ListSelection;

	beforeEach(() => (selection = new ListSelection()));

	it('toggles rows, keeping the revision each was read at', () => {
		selection.toggle(ITEMS[0], PAGE);
		selection.toggle(ITEMS[1], PAGE);
		selection.toggle(ITEMS[0], PAGE);

		expect(selection.selectedRefs()).toEqual([ITEMS[1]]);
		expect(selection.count(40)).toBe(1);
	});

	it('selects and unselects the whole page', () => {
		selection.selectPage(PAGE);
		expect(selection.isPageSelected(PAGE)).toBe(true);

		selection.unselectPage(PAGE);
		expect(selection.selectedRefs()).toEqual([]);
		expect(selection.isPageSelected({ items: [], draftIds: [] })).toBe(
			false
		);
	});

	it('counts every matching item once all matching are selected', () => {
		selection.toggle(ITEMS[0], PAGE);
		selection.selectAllMatching();

		expect(selection.count(40)).toBe(40);
		expect(selection.isSelected('anything')).toBe(true);
		expect(selection.selectedRefs()).toEqual([]);
	});

	it('keeps the rest of the page when a row is unselected from all matching', () => {
		selection.selectAllMatching();
		selection.toggle(ITEMS[0], PAGE);

		expect(selection.isAllMatching()).toBe(false);
		expect(selection.selectedRefs()).toEqual([ITEMS[1]]);
	});

	it('selects the page only when a preview is confirmed', () => {
		selection.previewPage();
		expect(selection.isPreviewingPage()).toBe(true);
		selection.endPreview(PAGE, false);
		expect(selection.isPreviewingPage()).toBe(false);
		expect(selection.count(40)).toBe(0);

		selection.previewPage();
		selection.endPreview(PAGE, true);
		expect(selection.selectedRefs()).toEqual(ITEMS);
	});

	it('clears everything', () => {
		selection.selectAllMatching();
		selection.clear();

		expect(selection.count(40)).toBe(0);
	});

	it('selects drafts with the page, and on their own', () => {
		const page = { items: ITEMS, draftIds: ['draft-1'] };
		selection.selectPage(page);
		expect(selection.selectedDraftIds()).toEqual(['draft-1']);
		expect(selection.count(40)).toBe(3);

		selection.toggleDraft('draft-1');
		expect(selection.isPageSelected(page)).toBe(false);
		selection.toggleDraft('draft-1');
		expect(selection.isPageSelected(page)).toBe(true);
	});

	it('keeps selected drafts when selecting every match', () => {
		selection.toggleDraft('draft-1');
		selection.selectAllMatching();

		expect(selection.count(40)).toBe(41);
		expect(selection.isDraftSelected('draft-1')).toBe(true);
	});
});
