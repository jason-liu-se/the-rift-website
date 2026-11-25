import { EditorContentType } from 'src/app/interfaces/api-requests';
import {
	FIELD_KEYS,
	FieldsOf
} from 'src/app/services/editor-content/editor-content-types';

/** A content type's fields as a draft holds them: any may be missing. */
export type DraftFields<T extends EditorContentType> = Partial<FieldsOf<T>>;

/** Whether a field has nothing in it: missing, null, '', or []. */
function isBlank(value: unknown): boolean {
	return (
		value === undefined ||
		value === null ||
		(typeof value === 'string' && value.trim() === '') ||
		(Array.isArray(value) && value.length === 0)
	);
}

/** The type's own fields of `item` (an item, or a draft's fields). */
export function pickFields<T extends EditorContentType>(
	type: T,
	item: object
): DraftFields<T> {
	const source = item as Record<string, unknown>;
	const keys = FIELD_KEYS[type] as string[];
	return Object.fromEntries(
		keys
			.filter((key) => !isBlank(source[key]))
			.map((key) => [key, source[key]])
	) as DraftFields<T>;
}

/** Whether every field is blank: such a draft isn't worth keeping. */
export function isEmptyDraft(fields: object): boolean {
	return Object.values(fields).every(isBlank);
}

/** Whether two sets of fields say the same, blank fields aside. */
export function isSameFields(first: object, second: object): boolean {
	return toComparable(first) === toComparable(second);
}

function toComparable(fields: object): string {
	const filled = Object.entries(fields)
		.filter(([, value]) => !isBlank(value))
		.sort(([a], [b]) => a.localeCompare(b));
	return JSON.stringify(filled);
}

/** The required fields `fields` leaves blank, in the order given. */
export function findMissingFields<K extends string>(
	fields: Partial<Record<K, unknown>>,
	required: readonly K[]
): K[] {
	return required.filter((key) => isBlank(fields[key]));
}
