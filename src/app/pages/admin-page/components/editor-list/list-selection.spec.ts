import { ListSelection } from './list-selection';

const PAGE = [
	{ id: 'a', startingRevision: 1 },
	{ id: 'b', startingRevision: 2 }
];

describe('ListSelection', () => {
	let selection: ListSelection;

	beforeEach(() => (selection = new ListSelection()));

	it('toggles rows, keeping the revision each was read at', () => {
		selection.toggle(PAGE[0], PAGE);
		selection.toggle(PAGE[1], PAGE);
		selection.toggle(PAGE[0], PAGE);

		expect(selection.selectedRefs()).toEqual([PAGE[1]]);
		expect(selection.count(40)).toBe(1);
	});

	it('selects and unselects the whole page', () => {
		selection.selectPage(PAGE);
		expect(selection.isPageSelected(PAGE)).toBe(true);

		selection.unselectPage(PAGE);
		expect(selection.selectedRefs()).toEqual([]);
		expect(selection.isPageSelected([])).toBe(false);
	});

	it('counts every matching item once all matching are selected', () => {
		selection.toggle(PAGE[0], PAGE);
		selection.selectAllMatching();

		expect(selection.count(40)).toBe(40);
		expect(selection.isSelected('anything')).toBe(true);
		expect(selection.selectedRefs()).toEqual([]);
	});

	it('keeps the rest of the page when a row is unselected from all matching', () => {
		selection.selectAllMatching();
		selection.toggle(PAGE[0], PAGE);

		expect(selection.isAllMatching()).toBe(false);
		expect(selection.selectedRefs()).toEqual([PAGE[1]]);
	});

	it('selects the page only when a preview is confirmed', () => {
		selection.previewPage();
		expect(selection.isPreviewingPage()).toBe(true);
		selection.endPreview(PAGE, false);
		expect(selection.isPreviewingPage()).toBe(false);
		expect(selection.count(40)).toBe(0);

		selection.previewPage();
		selection.endPreview(PAGE, true);
		expect(selection.selectedRefs()).toEqual(PAGE);
	});

	it('clears everything', () => {
		selection.selectAllMatching();
		selection.clear();

		expect(selection.count(40)).toBe(0);
	});
});
