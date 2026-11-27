import { DraftSummary } from 'src/app/core/api/api-responses';
import { EDITOR_GALLERY_COLLECTIONS } from 'src/app/testing/api-fixtures';
import { toCollectionCards } from './collection-cards';

const [SEASON_5] = EDITOR_GALLERY_COLLECTIONS;
const IMAGES = { one: 'image', many: 'images' };

describe('toCollectionCards', () => {
	it('lists new drafts first, then each collection with its URL and item count', () => {
		const cards = toCollectionCards({
			newDrafts: [{ id: 'draft-1', fields: { title: 'Season 7' } }],
			editDrafts: new Map(),
			collections: [SEASON_5],
			urlPrefix: '/gallery/',
			itemNoun: IMAGES
		});

		expect(
			cards.map(({ title, details, status, hasDraft }) => [
				title,
				details,
				status,
				hasDraft
			])
		).toEqual([
			['Season 7', '/gallery/…', 'draft', false],
			[
				SEASON_5.title,
				`/gallery/${SEASON_5.slug} · ${SEASON_5.itemCount} images · ${SEASON_5.dimensions?.length} dimensions`,
				undefined,
				false
			]
		]);
	});

	it("shows a collection's edit draft, and the open one as the form has it", () => {
		const editDrafts = new Map([
			[
				SEASON_5.slug,
				{ fields: { title: 'Renamed', visible: false } } as DraftSummary
			]
		]);
		const [closed] = toCollectionCards({
			newDrafts: [],
			editDrafts,
			collections: [SEASON_5],
			itemNoun: IMAGES
		});
		const [open] = toCollectionCards({
			newDrafts: [],
			editDrafts,
			collections: [SEASON_5],
			open: {
				draftId: 'draft-2',
				targetSlug: SEASON_5.slug,
				fields: { title: 'Typing…', visible: true },
				hasUnpublishedChanges: false
			},
			itemNoun: IMAGES
		});

		expect(closed).toMatchObject({
			title: 'Renamed',
			isVisible: false,
			hasDraft: true,
			isOpen: false
		});
		expect(open).toMatchObject({
			title: 'Typing…',
			isVisible: true,
			hasDraft: false,
			isOpen: true
		});
	});
});
