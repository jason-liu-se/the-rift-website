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

/** Each field's name and value, in order. */
export function toFieldRows(fields: object): { name: string; value: string }[] {
	return Object.entries(fields).map(([name, value]) => ({
		name,
		value: describeFieldValue(value)
	}));
}
