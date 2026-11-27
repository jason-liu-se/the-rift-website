/** A field's value as text, for showing two versions side by side. */
export function describeFieldValue(value: unknown): string {
	if (value === undefined || value === null || value === '') {
		return '(empty)';
	}
	if (Array.isArray(value)) {
		return value
			.map((entry) =>
				typeof entry === 'object' && entry && 'name' in entry
					? String(entry.name)
					: String(entry)
			)
			.join(', ');
	}
	return String(value);
}

/** Each labelled field's label and value, in the labels' order. */
export function toFieldRows(
	fields: object,
	labels: Record<string, string>
): { name: string; value: string }[] {
	return Object.entries(labels).map(([key, label]) => ({
		name: label,
		value: describeFieldValue((fields as Record<string, unknown>)[key])
	}));
}
