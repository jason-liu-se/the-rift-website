import { BulkItemRef } from 'src/app/core/api/api-requests';

/** What reordering reads from an item. */
export interface OrderedItem {
	id: string;
	revision: number;
	sortOrder?: number | null;
}

/** An item's new position, and its revision when it was read. */
export type OrderUpdate = BulkItemRef & { sortOrder: number };

/**
 * The updates that number `items`, in their new order, from 0: only for the
 * items whose `sortOrder` changes.
 */
export function toOrderUpdates(items: readonly OrderedItem[]): OrderUpdate[] {
	return items.flatMap(({ id, revision, sortOrder }, index) =>
		sortOrder === index
			? []
			: [{ id, startingRevision: revision, sortOrder: index }]
	);
}
