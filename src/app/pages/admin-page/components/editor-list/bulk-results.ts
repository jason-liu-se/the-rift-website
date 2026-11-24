import { BulkItemResult } from 'src/app/interfaces/api-responses';

/** How a content type's items are named in messages: "post", "posts". */
export interface ItemNoun {
	one: string;
	many: string;
}

export const DRAFT_NOUN: ItemNoun = { one: 'draft', many: 'drafts' };

/** What a bulk action did, for messages: "Deleted", "Moved". */
export type BulkActionName =
	'create' | 'delete' | 'show' | 'hide' | 'move' | 'add-tags' | 'remove-tags';

const DONE_VERBS: Record<BulkActionName, string> = {
	create: 'Published',
	delete: 'Deleted',
	show: 'Made visible',
	hide: 'Hid',
	move: 'Moved',
	'add-tags': 'Tagged',
	'remove-tags': 'Untagged'
};

/** One message for a bulk response, and whether anything failed. */
export interface BulkSummary {
	message: string;
	hasFailures: boolean;
}

export function countItems(count: number, noun: ItemNoun): string {
	return `${count} ${count === 1 ? noun.one : noun.many}`;
}

/**
 * Sums up every result of one bulk response in one message: what was done,
 * then every failure grouped by why, e.g. "Hid 3 posts. 2 weren't: 1 changed
 * since you loaded it, 1 no longer exists."
 */
export function summarizeBulkResults(
	action: BulkActionName,
	results: readonly BulkItemResult<unknown>[],
	noun: ItemNoun
): BulkSummary {
	const doneCount = results.filter(({ outcome }) => outcome === 'ok').length;
	const failures = results.length - doneCount;
	const done = `${DONE_VERBS[action]} ${countItems(doneCount, noun)}.`;
	if (failures === 0) {
		return { message: done, hasFailures: false };
	}
	const count = (outcome: BulkItemResult<unknown>['outcome']) =>
		results.filter((result) => result.outcome === outcome).length;
	const reasons = [...new Set(results.flatMap(invalidReason))];
	const why = [
		count('conflict') &&
			`${count('conflict')} changed since you loaded ${count('conflict') === 1 ? 'it' : 'them'} (reload and try again)`,
		count('not-found') &&
			`${count('not-found')} no longer ${count('not-found') === 1 ? 'exists' : 'exist'}`,
		count('invalid') &&
			`${count('invalid')} invalid (${reasons.join('; ')})`
	].filter(Boolean);
	return {
		message: `${done} ${failures} ${failures === 1 ? "wasn't" : "weren't"}: ${why.join(', ')}.`,
		hasFailures: true
	};
}

function invalidReason(result: BulkItemResult<unknown>): string[] {
	return result.outcome === 'invalid' ? [result.reason] : [];
}

/** `items` in chunks of at most `size`, in order. */
export function toChunks<T>(items: readonly T[], size: number): T[][] {
	const chunks: T[][] = [];
	for (let start = 0; start < items.length; start += size) {
		chunks.push(items.slice(start, start + size));
	}
	return chunks;
}
