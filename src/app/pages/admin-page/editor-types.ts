import { Type } from '@angular/core';
import { DEFAULT_MAP_DIMENSIONS } from 'src/app/config/maps';
import { EditorContentType } from 'src/app/interfaces/api-requests';
import {
	CollectionContentType,
	FieldsOf
} from 'src/app/services/editor-content/editor-content-types';
import { DownloadsFormComponent } from './components/downloads/downloads-form/downloads-form.component';
import { DownloadsItemCellComponent } from './components/downloads/downloads-item-cell/downloads-item-cell.component';
import { ItemNoun } from './components/editor-list/bulk-results';
import { FilterOption } from './components/editor-list/list-filters/list-filters.component';
import { GalleryBulkActionsComponent } from './components/gallery/gallery-bulk-actions/gallery-bulk-actions.component';
import { GalleryFormComponent } from './components/gallery/gallery-form/gallery-form.component';
import { GalleryItemCellComponent } from './components/gallery/gallery-item-cell/gallery-item-cell.component';
import { MapsFormComponent } from './components/maps/maps-form/maps-form.component';
import { MapsItemCellComponent } from './components/maps/maps-item-cell/maps-item-cell.component';
import { MoveBulkActionComponent } from './components/move-bulk-action/move-bulk-action.component';
import { NewsFormComponent } from './components/news/news-form/news-form.component';
import { NewsItemCellComponent } from './components/news/news-item-cell/news-item-cell.component';
import { DraftFields } from './drafts/draft-fields';

/** Everything that differs between the admin tools, per content type. */
export interface EditorTypeConfig<T extends EditorContentType> {
	label: string;
	/** A Material icon name, for the sidebar. */
	icon: string;
	noun: ItemNoun;
	statuses: readonly FilterOption[];
	searchFields: readonly FilterOption[];
	/** Each field's name as the editor sees it (e.g. in a conflict). */
	fieldLabels: Record<keyof FieldsOf<T>, string>;
	/** News: publishing chooses when it goes live. */
	hasDate: boolean;
	hasCollections: boolean;
	/** Takes many items at once (from the create button's menu). */
	hasBulkCreate: boolean;
	/** What a new item starts with (not counted as changes). */
	newItemFields: () => DraftFields<T>;
	/** The fields, given the open `session` (a `DraftSession<T>`). */
	form: Type<unknown>;
	/** The list's main cell, given an `item` (a `SummaryOf<T>`). */
	itemCell: Type<unknown>;
	/** The type's own bulk actions, beside the common ones. */
	bulkActions?: Type<unknown>;
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
		statuses: [
			{ value: 'live', label: 'Live' },
			{ value: 'scheduled', label: 'Scheduled' },
			{ value: 'hidden', label: 'Hidden' }
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
		hasDate: true,
		hasCollections: false,
		hasBulkCreate: false,
		newItemFields: () => ({}),
		form: NewsFormComponent,
		itemCell: NewsItemCellComponent
	},
	downloads: {
		label: 'Downloads',
		icon: 'download',
		noun: { one: 'download', many: 'downloads' },
		statuses: VISIBILITY_STATUSES,
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
			sortOrder: 'Sort order'
		},
		hasDate: false,
		hasCollections: true,
		hasBulkCreate: false,
		newItemFields: () => ({}),
		form: DownloadsFormComponent,
		itemCell: DownloadsItemCellComponent,
		bulkActions: MoveBulkActionComponent
	},
	gallery: {
		label: 'Gallery',
		icon: 'photo_library',
		noun: { one: 'image', many: 'images' },
		statuses: VISIBILITY_STATUSES,
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
		hasDate: false,
		hasCollections: true,
		hasBulkCreate: true,
		newItemFields: () => ({}),
		form: GalleryFormComponent,
		itemCell: GalleryItemCellComponent,
		bulkActions: GalleryBulkActionsComponent
	},
	maps: {
		label: 'Maps',
		icon: 'map',
		noun: { one: 'season', many: 'seasons' },
		statuses: VISIBILITY_STATUSES,
		searchFields: [
			{ value: 'season', label: 'Season number' },
			{ value: 'dimensions', label: 'Dimension names' }
		],
		fieldLabels: {
			season: 'Season',
			imageUrl: 'Image',
			dimensions: 'Dimensions'
		},
		hasDate: false,
		hasCollections: false,
		hasBulkCreate: false,
		newItemFields: () => ({
			dimensions: DEFAULT_MAP_DIMENSIONS.map((dimension) => ({
				...dimension
			}))
		}),
		form: MapsFormComponent,
		itemCell: MapsItemCellComponent
	}
};

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
