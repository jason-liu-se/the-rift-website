import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
	BulkDeleteRequest,
	BulkItemRef,
	CollectionCreateRequest,
	CollectionUpdateRequest,
	EditorContentType,
	GalleryImageBulkCreateRequest
} from '../../../core/api/api-requests';
import {
	BulkResponse,
	EditorCollection,
	EditorGalleryImage,
	EditorGalleryTags,
	PaginatedResponse
} from '../../../core/api/api-responses';
import {
	BulkUpdateRequestOf,
	CollectionContentType,
	CreateRequestOf,
	EDITOR_ITEMS_PATHS,
	ItemOf,
	ListQueryOf,
	SummaryOf,
	UpdateRequestOf
} from './editor-content-types';
import { EDITOR_REQUEST_OPTIONS } from './editor-request-options';

/**
 * The editor tools' API (`/editor/*`, logged in): every item, public or not.
 * Thin wrappers, typed per content type by `EditorContentTypes`.
 */
@Injectable({
	providedIn: 'root'
})
export class EditorContentService {
	private http = inject(HttpClient);
	private editorUrl = `${environment.API_URL}/editor`;

	public fetchItems<T extends EditorContentType>(
		type: T,
		query: ListQueryOf<T>
	): Observable<PaginatedResponse<SummaryOf<T>>> {
		return this.http.get<PaginatedResponse<SummaryOf<T>>>(
			this.itemsUrl(type),
			{ ...EDITOR_REQUEST_OPTIONS, params: toParams(query) }
		);
	}

	public fetchItem<T extends EditorContentType>(
		type: T,
		id: string
	): Observable<ItemOf<T>> {
		return this.http.get<ItemOf<T>>(
			this.itemUrl(type, id),
			EDITOR_REQUEST_OPTIONS
		);
	}

	public createItem<T extends EditorContentType>(
		type: T,
		request: CreateRequestOf<T>
	): Observable<ItemOf<T>> {
		return this.http.post<ItemOf<T>>(
			this.itemsUrl(type),
			request,
			EDITOR_REQUEST_OPTIONS
		);
	}

	public updateItem<T extends EditorContentType>(
		type: T,
		id: string,
		request: UpdateRequestOf<T>
	): Observable<ItemOf<T>> {
		return this.http.patch<ItemOf<T>>(
			this.itemUrl(type, id),
			request,
			EDITOR_REQUEST_OPTIONS
		);
	}

	public deleteItem(
		type: EditorContentType,
		{ id, startingRevision }: BulkItemRef
	): Observable<void> {
		return this.http.delete<void>(this.itemUrl(type, id), {
			...EDITOR_REQUEST_OPTIONS,
			params: { startingRevision }
		});
	}

	public bulkUpdate<T extends EditorContentType>(
		type: T,
		request: BulkUpdateRequestOf<T>
	): Observable<BulkResponse<ItemOf<T>>> {
		return this.http.patch<BulkResponse<ItemOf<T>>>(
			`${this.itemsUrl(type)}/bulk`,
			request,
			EDITOR_REQUEST_OPTIONS
		);
	}

	public bulkDelete(
		type: EditorContentType,
		request: BulkDeleteRequest
	): Observable<BulkResponse<never>> {
		return this.http.delete<BulkResponse<never>>(
			`${this.itemsUrl(type)}/bulk`,
			{ ...EDITOR_REQUEST_OPTIONS, body: request }
		);
	}

	public bulkCreateGalleryImages(
		request: GalleryImageBulkCreateRequest
	): Observable<BulkResponse<EditorGalleryImage>> {
		return this.http.post<BulkResponse<EditorGalleryImage>>(
			`${this.itemsUrl('gallery')}/bulk`,
			request,
			EDITOR_REQUEST_OPTIONS
		);
	}

	/** Every tag in use on gallery images (and the editor's drafts). */
	public fetchGalleryTags(): Observable<EditorGalleryTags> {
		return this.http.get<EditorGalleryTags>(
			`${this.editorUrl}/gallery/tags`,
			EDITOR_REQUEST_OPTIONS
		);
	}

	public fetchCollections(
		type: CollectionContentType
	): Observable<EditorCollection[]> {
		return this.http.get<EditorCollection[]>(
			this.collectionsUrl(type),
			EDITOR_REQUEST_OPTIONS
		);
	}

	public createCollection(
		type: CollectionContentType,
		request: CollectionCreateRequest
	): Observable<EditorCollection> {
		return this.http.post<EditorCollection>(
			this.collectionsUrl(type),
			request,
			EDITOR_REQUEST_OPTIONS
		);
	}

	public updateCollection(
		type: CollectionContentType,
		slug: string,
		request: CollectionUpdateRequest
	): Observable<EditorCollection> {
		return this.http.patch<EditorCollection>(
			`${this.collectionsUrl(type)}/${encodeURIComponent(slug)}`,
			request,
			EDITOR_REQUEST_OPTIONS
		);
	}

	public deleteCollection(
		type: CollectionContentType,
		slug: string,
		startingRevision: number
	): Observable<void> {
		return this.http.delete<void>(
			`${this.collectionsUrl(type)}/${encodeURIComponent(slug)}`,
			{ ...EDITOR_REQUEST_OPTIONS, params: { startingRevision } }
		);
	}

	private itemsUrl(type: EditorContentType): string {
		return `${this.editorUrl}/${EDITOR_ITEMS_PATHS[type]}`;
	}

	private itemUrl(type: EditorContentType, id: string): string {
		return `${this.itemsUrl(type)}/${encodeURIComponent(id)}`;
	}

	private collectionsUrl(type: CollectionContentType): string {
		return `${this.editorUrl}/${type}/collections`;
	}
}

/** Query parameters without the unset ones (an empty search is no search). */
function toParams(query: object): HttpParams {
	const entries = Object.entries(query).filter(
		([, value]) => value !== undefined && value !== ''
	);
	return new HttpParams({ fromObject: Object.fromEntries(entries) });
}
