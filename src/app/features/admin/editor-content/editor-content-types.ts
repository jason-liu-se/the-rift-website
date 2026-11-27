import {
	BulkDeleteRequest,
	CollectionDraftType,
	CollectionFields,
	DraftType,
	DownloadItemBulkUpdateRequest,
	DraftOptions,
	EditorCollectionType,
	DownloadItemFields,
	DownloadItemCreateRequest,
	DownloadItemUpdateRequest,
	EditorContentType,
	EditorListQuery,
	GalleryImageBulkUpdateRequest,
	GalleryImageFields,
	GalleryImageCreateRequest,
	GalleryImageUpdateRequest,
	MapSeasonBulkUpdateRequest,
	MapSeasonFields,
	MapSeasonCreateRequest,
	MapSeasonUpdateRequest,
	NewsPostBulkUpdateRequest,
	NewsPostFields,
	NewsDraftOptions,
	NewsPostCreateRequest,
	NewsPostUpdateRequest
} from '../../../core/api/api-requests';
import {
	ContentStatus,
	EditorCollection,
	EditorDownloadItem,
	EditorDownloadItemSummary,
	EditorGalleryImage,
	EditorMapSeason,
	EditorMapSeasonSummary,
	EditorNewsPost,
	EditorNewsPostSummary,
	NewsStatus
} from '../../../core/api/api-responses';

/** What each content type's editor endpoints take and answer. */
export interface EditorContentTypes {
	news: {
		/** The publish options a draft keeps beside the fields. */
		draftOptions: NewsDraftOptions;
		fields: NewsPostFields;
		summary: EditorNewsPostSummary;
		item: EditorNewsPost;
		status: NewsStatus;
		create: NewsPostCreateRequest;
		update: NewsPostUpdateRequest;
		bulkUpdate: NewsPostBulkUpdateRequest;
	};
	gallery: {
		draftOptions: DraftOptions;
		fields: GalleryImageFields;
		summary: EditorGalleryImage;
		item: EditorGalleryImage;
		status: ContentStatus;
		create: GalleryImageCreateRequest;
		update: GalleryImageUpdateRequest;
		bulkUpdate: GalleryImageBulkUpdateRequest;
	};
	downloads: {
		draftOptions: DraftOptions;
		fields: DownloadItemFields;
		summary: EditorDownloadItemSummary;
		item: EditorDownloadItem;
		status: ContentStatus;
		create: DownloadItemCreateRequest;
		update: DownloadItemUpdateRequest;
		bulkUpdate: DownloadItemBulkUpdateRequest;
	};
	maps: {
		draftOptions: DraftOptions;
		fields: MapSeasonFields;
		summary: EditorMapSeasonSummary;
		item: EditorMapSeason;
		status: ContentStatus;
		create: MapSeasonCreateRequest;
		update: MapSeasonUpdateRequest;
		bulkUpdate: MapSeasonBulkUpdateRequest;
	};
}

export type FieldsOf<T extends EditorContentType> =
	EditorContentTypes[T]['fields'];
export type SummaryOf<T extends EditorContentType> =
	EditorContentTypes[T]['summary'];
export type ItemOf<T extends EditorContentType> = EditorContentTypes[T]['item'];
export type StatusOf<T extends EditorContentType> =
	EditorContentTypes[T]['status'];
export type ListQueryOf<T extends EditorContentType> = EditorListQuery<
	StatusOf<T>
>;
export type CreateRequestOf<T extends EditorContentType> =
	EditorContentTypes[T]['create'];
export type UpdateRequestOf<T extends EditorContentType> =
	EditorContentTypes[T]['update'];
export type BulkUpdateRequestOf<T extends EditorContentType> =
	EditorContentTypes[T]['bulkUpdate'];

/** A bulk update's action without its items, to apply to any selection. */
export type BulkUpdateActionOf<T extends EditorContentType> =
	BulkUpdateRequestOf<T> extends infer Update
		? Update extends { items: unknown }
			? Omit<Update, 'items'>
			: never
		: never;

/** A bulk action on a selection: delete, or one of the type's updates. */
export type BulkActionOf<T extends EditorContentType> =
	{ action: 'delete' } | BulkUpdateActionOf<T>;

export type { BulkDeleteRequest };

/** The content types with collections. */
export type CollectionContentType = EditorCollectionType;

/** The draft type of a content type's collections. */
export function toCollectionDraftType(
	type: CollectionContentType
): CollectionDraftType {
	return `${type}-collections`;
}

/** Each content type's items, under /editor. */
export const EDITOR_ITEMS_PATHS: Record<EditorContentType, string> = {
	news: 'news',
	gallery: 'gallery/images',
	downloads: 'downloads/items',
	maps: 'maps/seasons'
};

/** What each draft type holds and publishes: a content type's item, or a collection. */
export type DraftTypes = {
	[T in EditorContentType]: Pick<
		EditorContentTypes[T],
		'fields' | 'item' | 'draftOptions'
	>;
} & Record<
	CollectionDraftType,
	{
		fields: CollectionFields;
		item: EditorCollection;
		draftOptions: DraftOptions;
	}
>;

export type DraftOwnFieldsOf<T extends DraftType> = DraftTypes[T]['fields'];
export type DraftItemOf<T extends DraftType> = DraftTypes[T]['item'];
export type DraftOptionsOf<T extends DraftType> = DraftTypes[T]['draftOptions'];

/** What an edit draft's target names: an item's ID, or a collection's slug. */
export function toTargetId(item: DraftItemOf<DraftType>): string {
	return 'id' in item ? item.id : item.slug;
}

/** A field as the editor names it, and whether publishing needs it. */
export interface FieldSpec {
	label: string;
	/** The API's required fields; the form marks them. */
	required?: boolean;
}

export type FieldSpecsOf<T extends DraftType> = Record<
	keyof DraftOwnFieldsOf<T>,
	FieldSpec
>;

const COLLECTION_FIELDS: FieldSpecsOf<'gallery-collections'> = {
	title: { label: 'Title', required: true },
	slug: { label: 'Slug', required: true },
	dimensions: { label: 'Dimensions' }
};

/**
 * Each draft type's own fields (what a draft holds and publishes): their
 * labels in the form and a conflict, and which publishing needs.
 */
export const DRAFT_FIELDS: { [T in DraftType]: FieldSpecsOf<T> } = {
	news: {
		title: { label: 'Title', required: true },
		content: { label: 'Content', required: true },
		imageUrl: { label: 'Banner image' }
	},
	gallery: {
		collection: { label: 'Collection', required: true },
		caption: { label: 'Caption', required: true },
		imageUrl: { label: 'Image', required: true },
		tags: { label: 'Tags' }
	},
	downloads: {
		collection: { label: 'Collection', required: true },
		title: { label: 'Title', required: true },
		desc: { label: 'Description', required: true },
		downloadUrl: { label: 'Download link', required: true },
		imageUrl: { label: 'Image', required: true },
		sortOrder: { label: 'Position' }
	},
	maps: {
		season: { label: 'Season', required: true },
		imageUrl: { label: 'Image' },
		dimensions: { label: 'Dimensions', required: true }
	},
	'gallery-collections': COLLECTION_FIELDS,
	'downloads-collections': COLLECTION_FIELDS
};

export function fieldKeysOf<T extends DraftType>(
	type: T
): (keyof DraftOwnFieldsOf<T>)[] {
	return Object.keys(DRAFT_FIELDS[type]) as (keyof DraftOwnFieldsOf<T>)[];
}

/** Each field's label, by its key (as a conflict lists them). */
export function fieldLabelsOf(type: DraftType): Record<string, string> {
	return Object.fromEntries(
		Object.entries(DRAFT_FIELDS[type]).map(([key, { label }]) => [
			key,
			label as string
		])
	);
}

/** The fields publishing needs. */
export function requiredFieldsOf(type: DraftType): string[] {
	return Object.entries(DRAFT_FIELDS[type] as Record<string, FieldSpec>)
		.filter(([, { required }]) => required)
		.map(([key]) => key);
}

/**
 * Each content type's draft options: kept in drafts, but not taken from a
 * published item (whose `date` an edit keeps unless the draft sets one).
 */
export const DRAFT_OPTION_KEYS: {
	[T in DraftType]: (keyof DraftOptionsOf<T>)[];
} = {
	news: ['visible', 'date'],
	gallery: ['visible'],
	downloads: ['visible'],
	maps: ['visible'],
	'gallery-collections': ['visible'],
	'downloads-collections': ['visible']
};
