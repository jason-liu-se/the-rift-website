import {
	BulkDeleteRequest,
	DownloadItemBulkUpdateRequest,
	DownloadItemCreateRequest,
	DownloadItemUpdateRequest,
	EditorContentType,
	EditorListQuery,
	GalleryImageBulkUpdateRequest,
	GalleryImageCreateRequest,
	GalleryImageUpdateRequest,
	MapSeasonBulkUpdateRequest,
	MapSeasonCreateRequest,
	MapSeasonUpdateRequest,
	NewsPostBulkUpdateRequest,
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
		summary: EditorNewsPostSummary;
		item: EditorNewsPost;
		status: NewsStatus;
		create: NewsPostCreateRequest;
		update: NewsPostUpdateRequest;
		bulkUpdate: NewsPostBulkUpdateRequest;
	};
	gallery: {
		summary: EditorGalleryImage;
		item: EditorGalleryImage;
		status: ContentStatus;
		create: GalleryImageCreateRequest;
		update: GalleryImageUpdateRequest;
		bulkUpdate: GalleryImageBulkUpdateRequest;
	};
	downloads: {
		summary: EditorDownloadItemSummary;
		item: EditorDownloadItem;
		status: ContentStatus;
		create: DownloadItemCreateRequest;
		update: DownloadItemUpdateRequest;
		bulkUpdate: DownloadItemBulkUpdateRequest;
	};
	maps: {
		summary: EditorMapSeasonSummary;
		item: EditorMapSeason;
		status: ContentStatus;
		create: MapSeasonCreateRequest;
		update: MapSeasonUpdateRequest;
		bulkUpdate: MapSeasonBulkUpdateRequest;
	};
}

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
