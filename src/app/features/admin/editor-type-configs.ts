import { Type, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { DEFAULT_MAP_DIMENSIONS } from 'src/app/core/config/maps';
import {
	EditorContentType,
	NewsDraftOptions
} from 'src/app/core/api/api-requests';
import { DraftSummary } from 'src/app/core/api/api-responses';
import { EditorContentApi } from 'src/app/features/admin/editor-content/editor-content-api';
import {
	CollectionContentType,
	SummaryOf
} from 'src/app/features/admin/editor-content/editor-content-types';
import { DownloadsForm } from './downloads/downloads-form/downloads-form';
import { DownloadsPreview } from './downloads/downloads-preview/downloads-preview';
import { ItemNoun } from './editor-list/bulk-results';
import { DateCell } from './editor-list/cells/date-cell/date-cell';
import { TextCell } from './editor-list/cells/text-cell/text-cell';
import { TitleCell } from './editor-list/cells/title-cell/title-cell';
import {
	ListColumn,
	STATUS_COLUMN,
	columnSort,
	UPDATED_COLUMN
} from './editor-list/list-columns';
import {
	COLLECTION_FILTER,
	CREATED_BY_FILTER,
	FilterOption,
	ListFilterField,
	statusFilter
} from './editor-list/list-filter-fields';
import { ListSort } from './editor-list/list-sort';
import { ItemStatus } from './status-badge/status-badge';
import { GalleryBulkActions } from './gallery/gallery-bulk-actions/gallery-bulk-actions';
import { GalleryForm } from './gallery/gallery-form/gallery-form';
import { GalleryPreview } from './gallery/gallery-preview/gallery-preview';
import { MapsForm } from './maps/maps-form/maps-form';
import { MoveBulkAction } from './move-bulk-action/move-bulk-action';
import { NewsForm } from './news/news-form/news-form';
import { NewsPreview } from './news/news-preview/news-preview';
import { DraftFields } from './drafts/draft-fields';
import {
	DOWNLOADS_PATH,
	MAP_PATH,
	NEWS_PATH,
	galleryCollectionPath
} from 'src/app/core/config/site-paths';

/** Downloads' collection column; ascending is the site's order. */
const DOWNLOAD_COLLECTION_COLUMN: ListColumn<'downloads'> = {
	id: 'collection',
	label: 'Collection',
	cell: TextCell,
	inputs: ({ fields }, { collectionTitle }) => ({
		text: collectionTitle(fields.collection)
	}),
	width: '12rem',
	sort: { by: 'collection,sortOrder,title', firstOrder: 'asc' },
	card: 'detail'
};

const RECENTLY_UPDATED = columnSort(UPDATED_COLUMN);

/** Everything that differs between the admin tools, per content type. */
export interface EditorTypeConfig<T extends EditorContentType> {
	label: string;
	/** A Material icon name, for the sidebar. */
	icon: string;
	noun: ItemNoun;
	/** The list's filters beside search, in order. */
	filters: readonly ListFilterField[];
	searchFields: readonly FilterOption[];
	/** News: publishing chooses when it goes live. */
	hasDate: boolean;
	hasCollections: boolean;
	/** Takes many items at once (from the create button's menu). */
	hasBulkCreate: boolean;
	/**
	 * What a new item starts with (not counted as changes). Called in the
	 * editor's injection context, so it can look something up.
	 */
	newItemFields: () => DraftFields<T> | Observable<DraftFields<T>>;
	/** The fields, given the open `session` (a `DraftSession<T>`). */
	form: Type<unknown>;
	/** The type's own bulk actions, beside the common ones. */
	bulkActions?: Type<unknown>;
	/** The draft as the site shows it, given the `session`, beside the form. */
	preview?: Type<unknown>;
	/**
	 * What a draft's row shows beyond its fields, as a published item's
	 * summary would have it.
	 */
	draftRowFields?: (
		draft: DraftSummary,
		published?: object
	) => Partial<SummaryOf<T>>;
	/** The list's columns, in table order (beside select and the row's menu). */
	columns: readonly ListColumn<T>[];
	/** The list's order until a column is chosen. */
	defaultSort: ListSort;
	/** Images list as a grid of cards; everything else as a table. */
	view: 'table' | 'grid';
	/**
	 * Can be put in order (`sortOrder`) within one collection, by dragging or
	 * from a row's menu; `defaultSort` is then the site's order.
	 */
	isOrderable: boolean;
	/** Where a live item shows on the site. */
	publicPath: (item: SummaryOf<T>) => string;
}

const VISIBILITY_STATUSES: readonly ItemStatus[] = ['live', 'hidden'];

export const EDITOR_TYPES: { [T in EditorContentType]: EditorTypeConfig<T> } = {
	news: {
		label: 'News',
		icon: 'newspaper',
		noun: { one: 'post', many: 'posts' },
		filters: [
			statusFilter(['live', 'scheduled', 'hidden']),
			CREATED_BY_FILTER
		],
		searchFields: [
			{ value: 'title', label: 'Title' },
			{ value: 'content', label: 'Content' }
		],
		hasDate: true,
		hasCollections: false,
		hasBulkCreate: false,
		newItemFields: () => ({}),
		form: NewsForm,
		preview: NewsPreview,
		columns: [
			{
				id: 'post',
				label: 'Post',
				cell: TitleCell,
				inputs: ({ fields }) => ({
					title: fields.title || 'Untitled',
					format: 'markdown',
					hasImage: true,
					imageUrl: fields.imageUrl
				}),
				sort: { by: 'title', firstOrder: 'asc' },
				card: 'title'
			},
			{
				id: 'date',
				label: 'Post date',
				cell: DateCell,
				inputs: ({ fields }) => ({
					date: fields.date,
					secondary: fields.editedAt && {
						label: 'Edited',
						date: fields.editedAt
					}
				}),
				width: '12rem',
				sort: { by: 'date', firstOrder: 'desc' },
				card: 'detail'
			},
			STATUS_COLUMN,
			UPDATED_COLUMN
		],
		defaultSort: RECENTLY_UPDATED,
		view: 'table',
		isOrderable: false,
		// The draft's own date, else "now" for a new post, or the post's own for
		// an edit (which keeps it).
		draftRowFields: (draft, published) => ({
			date:
				(draft.fields as NewsDraftOptions).date ??
				(draft.target
					? (published as { date?: string } | undefined)?.date
					: 'now')
		}),
		publicPath: () => NEWS_PATH
	},
	downloads: {
		label: 'Downloads',
		icon: 'download',
		noun: { one: 'download', many: 'downloads' },
		filters: [
			statusFilter(VISIBILITY_STATUSES),
			COLLECTION_FILTER,
			CREATED_BY_FILTER
		],
		searchFields: [
			{ value: 'title', label: 'Title' },
			{ value: 'desc', label: 'Description' }
		],
		hasDate: false,
		hasCollections: true,
		hasBulkCreate: false,
		newItemFields: () => ({}),
		form: DownloadsForm,
		bulkActions: MoveBulkAction,
		preview: DownloadsPreview,
		columns: [
			{
				id: 'download',
				label: 'Download',
				cell: TitleCell,
				inputs: ({ fields }) => ({
					title: fields.title || 'Untitled',
					hasImage: true,
					imageUrl: fields.imageUrl
				}),
				sort: { by: 'title', firstOrder: 'asc' },
				card: 'title'
			},
			DOWNLOAD_COLLECTION_COLUMN,
			STATUS_COLUMN,
			UPDATED_COLUMN
		],
		defaultSort: columnSort(DOWNLOAD_COLLECTION_COLUMN),
		view: 'table',
		isOrderable: true,
		publicPath: () => DOWNLOADS_PATH
	},
	gallery: {
		label: 'Gallery',
		icon: 'photo_library',
		noun: { one: 'image', many: 'images' },
		filters: [
			statusFilter(VISIBILITY_STATUSES),
			COLLECTION_FILTER,
			CREATED_BY_FILTER
		],
		searchFields: [
			{ value: 'caption', label: 'Caption' },
			{ value: 'tags', label: 'Tags' }
		],
		hasDate: false,
		hasCollections: true,
		hasBulkCreate: true,
		newItemFields: () => ({}),
		form: GalleryForm,
		bulkActions: GalleryBulkActions,
		preview: GalleryPreview,
		columns: [
			{
				id: 'caption',
				label: 'Caption',
				cell: TitleCell,
				inputs: ({ fields }, { collectionTitle }) => ({
					title: fields.caption || 'Untitled',
					details: [
						collectionTitle(fields.collection),
						fields.tags?.join(', ')
					]
						.filter(Boolean)
						.join(' · '),
					hasImage: true,
					imageUrl: fields.imageUrl,
					imagePosition: 'top'
				}),
				sort: { by: 'caption', firstOrder: 'asc' },
				card: 'title'
			},
			{
				id: 'uploaded',
				label: 'Uploaded',
				cell: DateCell,
				inputs: ({ fields }) => ({ date: fields.createdAt }),
				width: '12rem',
				sort: { by: 'createdAt', firstOrder: 'desc' },
				card: 'desktop'
			},
			STATUS_COLUMN,
			UPDATED_COLUMN
		],
		defaultSort: RECENTLY_UPDATED,
		view: 'grid',
		isOrderable: false,
		publicPath: (image) => galleryCollectionPath(image.collection)
	},
	maps: {
		label: 'Maps',
		icon: 'map',
		noun: { one: 'season', many: 'seasons' },
		filters: [statusFilter(VISIBILITY_STATUSES), CREATED_BY_FILTER],
		searchFields: [
			{ value: 'season', label: 'Season number' },
			{ value: 'dimensions', label: 'Dimension names' }
		],
		hasDate: false,
		hasCollections: false,
		hasBulkCreate: false,
		newItemFields: () => newMapSeasonFields(),
		form: MapsForm,
		columns: [
			{
				id: 'season',
				label: 'Season',
				cell: TitleCell,
				inputs: ({ fields: { season, dimensionCount } }) => ({
					title:
						season !== undefined ? `Season ${season}` : 'Untitled',
					details:
						dimensionCount === undefined
							? undefined
							: `${dimensionCount} ${dimensionCount === 1 ? 'dimension' : 'dimensions'}`
				}),
				sort: { by: 'season', firstOrder: 'desc' },
				card: 'title'
			},
			STATUS_COLUMN,
			UPDATED_COLUMN
		],
		defaultSort: RECENTLY_UPDATED,
		view: 'table',
		isOrderable: false,
		draftRowFields: (draft) => ({
			dimensionCount:
				'dimensionCount' in draft ? draft.dimensionCount : undefined
		}),
		publicPath: () => MAP_PATH
	}
};

/** A new season: the one after the latest, with BlueMap's default maps. */
function newMapSeasonFields(): Observable<DraftFields<'maps'>> {
	const dimensions = DEFAULT_MAP_DIMENSIONS.map((dimension) => ({
		...dimension
	}));
	return inject(EditorContentApi)
		.fetchItems('maps', { sort: 'season', order: 'desc', limit: 1 })
		.pipe(
			map(({ items: [latest] }) => ({
				season: (latest?.season ?? 0) + 1,
				dimensions
			})),
			catchError(() => of({ dimensions }))
		);
}

/** The admin tools, in sidebar order. */
export const EDITOR_TYPE_ORDER: readonly EditorContentType[] = [
	'news',
	'downloads',
	'gallery',
	'maps'
];

/** The type, if it has collections. */
export function toCollectionType(
	type: EditorContentType
): CollectionContentType | undefined {
	return EDITOR_TYPES[type].hasCollections
		? (type as CollectionContentType)
		: undefined;
}
