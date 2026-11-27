/** A tag as the API stores it: trimmed and lowercase. */
export function normalizeTag(tag: string): string {
	return tag.trim().toLowerCase();
}

/**
 * Tags as a gallery's `?tags=` takes them: normalised, unique, sorted, and
 * comma-separated (the API refuses anything else).
 */
export function toTagsQuery(tags: readonly string[]): string {
	const normalized = tags.map(normalizeTag).filter((tag) => tag !== '');
	return [...new Set(normalized)].sort().join(',');
}
