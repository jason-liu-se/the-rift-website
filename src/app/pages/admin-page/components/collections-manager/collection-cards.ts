import { DraftSummary, EditorCollection } from 'src/app/core/api/api-responses';
import {
	CollectionTarget,
	NewCollectionDraft
} from '../collections-modal/collections-editor';
import { ItemNoun, countItems } from '../editor-list/bulk-results';

/**
 * A collection as the list shows it: a published one with the editor's
 * draft on top, or a new one's draft.
 */
export interface CollectionCard {
	/** The published collection, or a new one's draft ID. */
	target: CollectionTarget;
	title: string;
	/** Its URL, item count, and dimension count. */
	details: string;
	isVisible: boolean;
	/** Why it differs from the site, if it does. */
	status?: 'Unpublished' | 'Unpublished changes';
	isOpen: boolean;
}

/** The draft open in the form, as the cards show it. */
export interface OpenCollectionDraft {
	draftId: string;
	/** The published collection's slug, for an edit. */
	targetSlug?: string;
	fields: {
		title?: string;
		slug?: string;
		visible?: boolean;
		dimensions?: unknown[];
	};
	hasUnpublishedChanges: boolean;
}

/**
 * The cards: new collections' drafts first, then the published ones. The
 * open draft shows its fields as they are in the form.
 */
export function toCollectionCards({
	newDrafts,
	editDrafts,
	collections,
	open,
	urlPrefix = '',
	itemNoun
}: {
	newDrafts: readonly NewCollectionDraft[];
	/** Each published collection's edit draft, by its slug. */
	editDrafts: ReadonlyMap<string, DraftSummary>;
	collections: readonly EditorCollection[];
	open?: OpenCollectionDraft;
	/** Where a collection's page is, before its slug (the gallery's). */
	urlPrefix?: string;
	itemNoun: ItemNoun;
}): CollectionCard[] {
	const pathOf = (slug: string | undefined) => `${urlPrefix}${slug || '…'}`;
	const newCards = newDrafts.map(({ id, fields, dimensionCount }) => {
		const isOpen = open?.draftId === id;
		const shown = isOpen ? open.fields : fields;
		return {
			target: id,
			title: shown.title || 'Untitled',
			details: [
				pathOf(shown.slug),
				...toDimensionCount(
					isOpen ? open.fields.dimensions?.length : dimensionCount
				)
			].join(' · '),
			isVisible: shown.visible ?? true,
			status: 'Unpublished' as const,
			isOpen
		};
	});
	const publishedCards = collections.map((collection) => {
		const isOpen = !!open && open.targetSlug === collection.slug;
		const draft = editDrafts.get(collection.slug);
		const shown = (isOpen ? open.fields : draft?.fields) as
			{ title?: string; visible?: boolean } | undefined;
		const hasDraft = isOpen ? open.hasUnpublishedChanges : !!draft;
		return {
			target: collection,
			title: shown?.title || collection.title,
			details: [
				pathOf(collection.slug),
				countItems(collection.itemCount, itemNoun),
				...toDimensionCount(collection.dimensions?.length)
			].join(' · '),
			isVisible: shown?.visible ?? collection.visible,
			status: hasDraft ? ('Unpublished changes' as const) : undefined,
			isOpen
		};
	});
	return [...newCards, ...publishedCards];
}

function toDimensionCount(count: number | undefined): string[] {
	if (!count) {
		return [];
	}
	return [`${count} ${count === 1 ? 'dimension' : 'dimensions'}`];
}
