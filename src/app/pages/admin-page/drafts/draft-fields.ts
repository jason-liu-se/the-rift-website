import {
	DraftOptions,
	EditorContentType
} from 'src/app/interfaces/api-requests';
import {
	FIELD_KEYS,
	FieldsOf
} from 'src/app/services/editor-content/editor-content-types';

/**
 * A content type's fields as a draft holds them (any may be missing), with
 * the publish options it keeps.
 */
export type DraftFields<T extends EditorContentType> = Partial<FieldsOf<T>> &
	DraftOptions;

const OPTION_KEYS: (keyof DraftOptions)[] = ['visible'];

/** Whether a field has nothing in it: missing, null, '', or []. */
function isBlank(value: unknown): boolean {
	return (
		value === undefined ||
		value === null ||
		(typeof value === 'string' && value.trim() === '') ||
		(Array.isArray(value) && value.length === 0)
	);
}

/**
 * The type's own fields and the draft options of `item` (an item, or a
 * draft's fields).
 */
export function pickFields<T extends EditorContentType>(
	type: T,
	item: object
): DraftFields<T> {
	const source = item as Record<string, unknown>;
	const keys = [...(FIELD_KEYS[type] as string[]), ...OPTION_KEYS];
	return Object.fromEntries(
		keys
			.filter((key) => !isBlank(source[key]))
			.map((key) => [key, source[key]])
	) as DraftFields<T>;
}

/**
 * Whether every field is blank (options aside): such a draft isn't worth
 * keeping.
 */
export function isEmptyDraft(fields: object): boolean {
	return Object.entries(fields).every(
		([key, value]) =>
			OPTION_KEYS.includes(key as keyof DraftOptions) || isBlank(value)
	);
}

/** With `visible` set: a draft without it publishes visible. */
export function withVisibility<T extends EditorContentType>(
	fields: DraftFields<T>
): DraftFields<T> {
	return { visible: true, ...fields };
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
