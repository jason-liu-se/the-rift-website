/**
 * A gallery collection's display name, from its API name: `season5` (or
 * `season-5`) → `Season 5`.
 */
export function galleryCollectionTitle(collectionName: string): string {
	const words = collectionName
		.replace(/[-_]+/g, ' ')
		.replace(/([a-z])(\d)/gi, '$1 $2')
		.trim();
	return words.charAt(0).toUpperCase() + words.slice(1);
}
