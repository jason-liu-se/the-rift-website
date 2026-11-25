import { BulkItemRef } from 'src/app/interfaces/api-requests';
import { BulkItemResult } from 'src/app/interfaces/api-responses';

/** What an update reads and changes on an item (any type's). */
export interface UndoableItem {
	id: string;
	revision: number;
	visible: boolean;
	collection?: string;
	tags?: string[];
}

/** A bulk update every type, or the types with collections or tags, has. */
export type UndoableAction =
	| { action: 'show' | 'hide' }
	| { action: 'move'; collection: string }
	| { action: 'add-tags' | 'remove-tags'; tags: string[] };

/** A bulk update and the items it applies to. */
export type UndoStep = UndoableAction & { items: BulkItemRef[] };

/** Whether `action` would change `item`, so only those are sent. */
export function wouldChange(
	action: UndoableAction,
	item: UndoableItem
): boolean {
	switch (action.action) {
		case 'show':
			return !item.visible;
		case 'hide':
			return item.visible;
		case 'move':
			return item.collection !== action.collection;
		case 'add-tags':
			return action.tags.some((tag) => !item.tags?.includes(tag));
		case 'remove-tags':
			return action.tags.some((tag) => item.tags?.includes(tag));
	}
}

/**
 * The bulk updates that put the items `action` changed back as they were
 * (`before`), at their new revisions. Items needing the same change share one
 * update: a move goes back to each item's own collection, and only tags an
 * item didn't already have are removed (and only those it had, re-added).
 */
export function toUndoSteps(
	action: UndoableAction,
	before: ReadonlyMap<string, UndoableItem>,
	results: readonly BulkItemResult<UndoableItem>[]
): UndoStep[] {
	const changed = results.flatMap((result) => {
		const original = before.get(result.id);
		return result.outcome === 'ok' && result.item && original
			? [{ original, ref: toRef(result.item) }]
			: [];
	});
	if (changed.length === 0) {
		return [];
	}
	switch (action.action) {
		case 'show':
		case 'hide':
			return [
				{
					action: action.action === 'show' ? 'hide' : 'show',
					items: changed.map(({ ref }) => ref)
				}
			];
		case 'move':
			return groupBy(changed, ({ original }) => original.collection ?? '')
				.filter(([collection]) => collection)
				.map(([collection, group]) => ({
					action: 'move',
					collection,
					items: group.map(({ ref }) => ref)
				}));
		case 'add-tags':
		case 'remove-tags': {
			const isAdd = action.action === 'add-tags';
			const tagsToRevert = (original: UndoableItem) =>
				action.tags.filter(
					(tag) => (original.tags?.includes(tag) ?? false) !== isAdd
				);
			return groupBy(changed, ({ original }) =>
				tagsToRevert(original).join('\n')
			)
				.filter(([tags]) => tags)
				.map(([tags, group]) => ({
					action: isAdd ? 'remove-tags' : 'add-tags',
					tags: tags.split('\n'),
					items: group.map(({ ref }) => ref)
				}));
		}
	}
}

function toRef({ id, revision }: UndoableItem): BulkItemRef {
	return { id, startingRevision: revision };
}

/** `items` grouped by `key`, in the order each key first appears. */
function groupBy<T>(items: readonly T[], key: (item: T) => string): [string, T[]][] {
	const groups = new Map<string, T[]>();
	for (const item of items) {
		const groupKey = key(item);
		groups.set(groupKey, [...(groups.get(groupKey) ?? []), item]);
	}
	return [...groups];
}
