import { Type, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { DEFAULT_MAP_DIMENSIONS } from 'src/app/core/config/maps';
import { EditorContentType } from 'src/app/core/api/api-requests';
import { EditorContentService } from 'src/app/features/admin/editor-content/editor-content.service';
import {
	CollectionContentType,
	FieldsOf,
	SummaryOf
} from 'src/app/features/admin/editor-content/editor-content-types';
import { DownloadsFormComponent } from './downloads/downloads-form/downloads-form.component';
import { DownloadsPreviewComponent } from './downloads/downloads-preview/downloads-preview.component';
import { ItemNoun } from './editor-list/bulk-results';
import { DateCellComponent } from './editor-list/cells/date-cell/date-cell.component';
import { TextCellComponent } from './editor-list/cells/text-cell/text-cell.component';
import { TitleCellComponent } from './editor-list/cells/title-cell/title-cell.component';
import {
	ListColumn,
	STATUS_COLUMN,
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
import { GalleryBulkActionsComponent } from './gallery/gallery-bulk-actions/gallery-bulk-actions.component';
import { GalleryFormComponent } from './gallery/gallery-form/gallery-form.component';
import { GalleryPreviewComponent } from './gallery/gallery-preview/gallery-preview.component';
import { MapsFormComponent } from './maps/maps-form/maps-form.component';
import { MoveBulkActionComponent } from './move-bulk-action/move-bulk-action.component';
import { NewsFormComponent } from './news/news-form/news-form.component';
import { NewsPreviewComponent } from './news/news-preview/news-preview.component';
import { DraftFields } from './drafts/draft-fields';

const RECENTLY_UPDATED: ListSort = { sort: 'updatedAt', order: 'desc' };

/** Everything that differs between the admin tools, per content type. */
export interface EditorTypeConfig<T extends EditorContentType> {
	label: string;
	/** A Material icon name, for the sidebar. */
	icon: string;
	noun: ItemNoun;
	/** The list's filters beside search, in order. */
	filters: readonly ListFilterField[];
	searchFields: readonly FilterOption[];
	/** Each field's name as the editor sees it (e.g. in a conflict). */
	fieldLabels: Record<keyof FieldsOf<T>, string>;
	/** What publishing needs filled in (the API's required fields). */
	requiredFields: readonly (keyof FieldsOf<T>)[];
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

const VISIBILITY_STATUSES: readonly FilterOption[] = [
	{ value: 'live', label: 'Live' },
	{ value: 'hidden', label: 'Hidden' }
];

export const EDITOR_TYPES: { [T in EditorContentType]: EditorTypeConfig<T> } = {
	news: {
		label: 'News',
		icon: 'newspaper',
		noun: { one: 'post', many: 'posts' },
		filters: [
			statusFilter([
				{ value: 'live', label: 'Live' },
				{ value: 'scheduled', label: 'Scheduled' },
				{ value: 'hidden', label: 'Hidden' }
			]),
			CREATED_BY_FILTER
		],
		searchFields: [
			{ value: 'title', label: 'Title' },
			{ value: 'content', label: 'Content' }
		],
		fieldLabels: {
			title: 'Title',
			content: 'Content',
			imageUrl: 'Banner image'
		},
		requiredFields: ['title', 'content'],
		hasDate: true,
		hasCollections: false,
		hasBulkCreate: false,
		newItemFields: () => ({}),
		form: NewsFormComponent,
		preview: NewsPreviewComponent,
		columns: [
			{
				id: 'post',
				label: 'Post',
				cell: TitleCellComponent,
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
				cell: DateCellComponent,
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
		publicPath: () => '/news'
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
		fieldLabels: {
			collection: 'Collection',
			title: 'Title',
			desc: 'Description',
			downloadUrl: 'Download link',
			imageUrl: 'Image',
			sortOrder: 'Position'
		},
		requiredFields: [
			'collection',
			'title',
			'desc',
			'downloadUrl',
			'imageUrl'
		],
		hasDate: false,
		hasCollections: true,
		hasBulkCreate: false,
		newItemFields: () => ({}),
		form: DownloadsFormComponent,
		bulkActions: MoveBulkActionComponent,
		preview: DownloadsPreviewComponent,
		columns: [
			{
				id: 'download',
				label: 'Download',
				cell: TitleCellComponent,
				inputs: ({ fields }) => ({
					title: fields.title || 'Untitled',
					hasImage: true,
					imageUrl: fields.imageUrl
				}),
				sort: { by: 'title', firstOrder: 'asc' },
				card: 'title'
			},
			{
				id: 'collection',
				label: 'Collection',
				cell: TextCellComponent,
				inputs: ({ fields }, { collectionTitle }) => ({
					text: collectionTitle(fields.collection)
				}),
				width: '12rem',
				// Ascending, the site's order.
				sort: { by: 'collection,sortOrder,title', firstOrder: 'asc' },
				card: 'detail'
			},
			STATUS_COLUMN,
			UPDATED_COLUMN
		],
		defaultSort: { sort: 'collection,sortOrder,title', order: 'asc' },
		view: 'table',
		isOrderable: true,
		publicPath: () => '/downloads'
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
		fieldLabels: {
			collection: 'Collection',
			caption: 'Caption',
			imageUrl: 'Image',
			tags: 'Tags'
		},
		requiredFields: ['collection', 'caption', 'imageUrl'],
		hasDate: false,
		hasCollections: true,
		hasBulkCreate: true,
		newItemFields: () => ({}),
		form: GalleryFormComponent,
		bulkActions: GalleryBulkActionsComponent,
		preview: GalleryPreviewComponent,
		columns: [
			{
				id: 'caption',
				label: 'Caption',
				cell: TitleCellComponent,
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
				cell: DateCellComponent,
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
		publicPath: (image) => `/gallery/${image.collection}`
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
		fieldLabels: {
			season: 'Season',
			imageUrl: 'Image',
			dimensions: 'Dimensions'
		},
		requiredFields: ['season', 'dimensions'],
		hasDate: false,
		hasCollections: false,
		hasBulkCreate: false,
		newItemFields: () => newMapSeasonFields(),
		form: MapsFormComponent,
		columns: [
			{
				id: 'season',
				label: 'Season',
				cell: TitleCellComponent,
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
		publicPath: () => '/map'
	}
};

/** A new season: the one after the latest, with BlueMap's default maps. */
function newMapSeasonFields(): Observable<DraftFields<'maps'>> {
	const dimensions = DEFAULT_MAP_DIMENSIONS.map((dimension) => ({
		...dimension
	}));
	return inject(EditorContentService)
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
