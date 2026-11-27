/** A collection's slug, as the API takes it: kebab-case. */
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** A title as a slug: "Season 7!" is "season-7". */
export function toSlug(title: string): string {
	return title
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/** Why `slug` can't be used, or undefined if it can. */
export function findSlugProblem(slug: string): string | undefined {
	if (!slug) {
		return 'Enter a slug.';
	}
	if (!SLUG_PATTERN.test(slug)) {
		return 'Use lowercase letters and numbers, with single hyphens between words (e.g. season-5).';
	}
	return undefined;
}
