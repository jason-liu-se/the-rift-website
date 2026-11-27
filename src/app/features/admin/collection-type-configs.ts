import { ImageUploadForm } from 'src/app/core/api/api-requests';
import { CollectionContentType } from './editor-content/editor-content-types';
import { ItemNoun } from './editor-list/bulk-results';
import { findSlugProblem } from './collection-form/collection-slug';

/** What differs between the content types' collections. */
export interface CollectionTypeConfig {
	/** Where a collection's own page is, before its slug; none without one. */
	pathPrefix?: string;
	/** Where a collection's images upload to, once its slug is valid. */
	uploadAlbum: (slug: string) => ImageUploadForm | undefined;
}

export const COLLECTION_NOUN: ItemNoun = {
	one: 'collection',
	many: 'collections'
};

/** A collection's fields, as a conflict lists their version beside mine. */
export const COLLECTION_FIELD_LABELS = {
	title: 'Title',
	slug: 'Slug',
	dimensions: 'Dimensions'
};

export const COLLECTION_TYPES: Record<
	CollectionContentType,
	CollectionTypeConfig
> = {
	// Each gallery collection has its own page and album.
	gallery: {
		pathPrefix: '/gallery/',
		uploadAlbum: (slug) =>
			findSlugProblem(slug)
				? undefined
				: { album: 'gallery', collection: slug }
	},
	downloads: {
		uploadAlbum: () => ({ album: 'downloads' })
	}
};
