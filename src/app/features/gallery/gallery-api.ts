import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CONTENT_VERSION_MAX_AGE_MS } from '../../core/config/api';
import {
	GalleryCollection,
	GalleryImage,
	GalleryTags,
	PaginatedResponse
} from '../../core/api/api-responses';
import { toTagsQuery } from './gallery-tags';
import { TimedRequest, reuseUntilOld } from '../../core/api/reuse-until-old';

@Injectable({
	providedIn: 'root'
})
export class GalleryApi {
	private http = inject(HttpClient);
	private galleryUrl = `${environment.API_URL}/gallery`;
	private latestCollections?: TimedRequest<GalleryCollection[]>;

	/**
	 * Every public gallery, sorted by slug. Shared by its callers for as long
	 * as the content version is (CONTENT_VERSION_MAX_AGE_MS): opening a gallery
	 * checks it exists, then reads its title for the page title and
	 * description, all from one request.
	 */
	public fetchCollections(): Observable<GalleryCollection[]> {
		this.latestCollections = reuseUntilOld(
			this.latestCollections,
			CONTENT_VERSION_MAX_AGE_MS,
			() =>
				this.http
					.get<GalleryCollection[]>(this.galleryUrl)
					.pipe(shareReplay(1))
		);
		return this.latestCollections.response$;
	}

	/* Fetches the specified collection by its slug */
	public fetchCollection(
		slug: string
	): Observable<GalleryCollection | undefined> {
		return this.fetchCollections().pipe(
			map((collections) =>
				collections.find((collection) => collection.slug === slug)
			)
		);
	}

	/** A gallery's title, or undefined when there's no such public gallery. */
	public findCollectionTitle(slug: string): Observable<string | undefined> {
		return this.fetchCollections().pipe(
			map(
				(collections) =>
					collections.find((collection) => collection.slug === slug)
						?.title
			)
		);
	}

	/** A page of a gallery's images, only those with every one of `tags`. */
	public fetchCollectionImages(
		slug: string,
		startIndex: number,
		limit: number,
		tags: readonly string[] = []
	): Observable<PaginatedResponse<GalleryImage>> {
		return this.http.get<PaginatedResponse<GalleryImage>>(
			`${this.galleryUrl}/${encodeURIComponent(slug)}`,
			{
				params: {
					startIndex,
					limit,
					...(tags.length > 0 && { tags: toTagsQuery(tags) })
				}
			}
		);
	}

	/** Every tag on a gallery's public images, sorted. */
	public fetchCollectionTags(slug: string): Observable<GalleryTags> {
		return this.http.get<GalleryTags>(
			`${this.galleryUrl}/${encodeURIComponent(slug)}/tags`
		);
	}
}
