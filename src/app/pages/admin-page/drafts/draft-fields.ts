import { EditorContentType } from 'src/app/interfaces/api-requests';
import {
	DRAFT_OPTION_KEYS,
	DraftOptionsOf,
	FIELD_KEYS,
	FieldsOf
} from 'src/app/services/editor-content/editor-content-types';

/**
 * A content type's fields as a draft holds them (any may be missing), with
 * the publish options it keeps.
 */
export type DraftFields<T extends EditorContentType> = Partial<FieldsOf<T>> &
	DraftOptionsOf<T>;

const OPTION_KEYS = new Set<string>(Object.values(DRAFT_OPTION_KEYS).flat());

/** Whether a field has nothing in it: missing, null, '', or []. */
function isBlank(value: unknown): boolean {
	return (
		value === undefined ||
		value === null ||
		(typeof value === 'string' && value.trim() === '') ||
		(Array.isArray(value) && value.length === 0)
	);
}

/** The type's own fields and draft options of a draft's `fields`. */
export function pickDraftFields<T extends EditorContentType>(
	type: T,
	fields: object
): DraftFields<T> {
	return pickKeys(fields, [...FIELD_KEYS[type], ...DRAFT_OPTION_KEYS[type]]);
}

/**
 * A published item's fields as a draft would hold them: its own fields and
 * visibility. Not its date, which a draft leaves out to keep.
 */
export function pickItemFields<T extends EditorContentType>(
	type: T,
	item: object
): DraftFields<T> {
	return pickKeys(item, [...FIELD_KEYS[type], 'visible']);
}

function pickKeys<T extends EditorContentType>(
	source: object,
	keys: readonly PropertyKey[]
): DraftFields<T> {
	const values = source as Record<PropertyKey, unknown>;
	return Object.fromEntries(
		keys
			.filter((key) => !isBlank(values[key]))
			.map((key) => [key, values[key]])
	) as DraftFields<T>;
}

/**
 * Whether every field is blank (options aside): such a draft isn't worth
 * keeping.
 */
export function isEmptyDraft(fields: object): boolean {
	return Object.entries(fields).every(
		([key, value]) => OPTION_KEYS.has(key) || isBlank(value)
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
