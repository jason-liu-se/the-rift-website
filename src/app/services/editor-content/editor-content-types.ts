import {
	BulkDeleteRequest,
	DownloadItemBulkUpdateRequest,
	DraftOptions,
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
} from '../../interfaces/api-requests';
import {
	ContentStatus,
	EditorDownloadItem,
	EditorDownloadItemSummary,
	EditorGalleryImage,
	EditorMapSeason,
	EditorMapSeasonSummary,
	EditorNewsPost,
	EditorNewsPostSummary,
	NewsStatus
} from '../../interfaces/api-responses';

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
export type DraftOptionsOf<T extends EditorContentType> =
	EditorContentTypes[T]['draftOptions'];
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
export type CollectionContentType = Extract<
	EditorContentType,
	'gallery' | 'downloads'
>;

/** Each content type's items, under /editor. */
export const EDITOR_ITEMS_PATHS: Record<EditorContentType, string> = {
	news: 'news',
	gallery: 'gallery/images',
	downloads: 'downloads/items',
	maps: 'maps/seasons'
};

/** Each content type's own fields: what a draft holds and publishes. */
export const FIELD_KEYS: { [T in EditorContentType]: (keyof FieldsOf<T>)[] } = {
	news: ['title', 'content', 'imageUrl'],
	gallery: ['collection', 'caption', 'imageUrl', 'tags'],
	downloads: [
		'collection',
		'title',
		'desc',
		'downloadUrl',
		'imageUrl',
		'sortOrder'
	],
	maps: ['season', 'imageUrl', 'dimensions']
};

/**
 * Each content type's draft options: kept in drafts, but not taken from a
 * published item (whose `date` an edit keeps unless the draft sets one).
 */
export const DRAFT_OPTION_KEYS: {
	[T in EditorContentType]: (keyof DraftOptionsOf<T>)[];
} = {
	news: ['visible', 'date'],
	gallery: ['visible'],
	downloads: ['visible'],
	maps: ['visible']
};
