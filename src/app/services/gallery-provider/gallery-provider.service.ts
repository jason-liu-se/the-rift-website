import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
	GalleryCollectionNames,
	GalleryImage,
	PaginatedResponse
} from '../../interfaces/api-responses';

@Injectable({
	providedIn: 'root'
})
export class GalleryProviderService {
	private http = inject(HttpClient);
	private galleryUrl = `${environment.API_URL}/gallery`;

	public getCollectionNamesObservable(): Observable<GalleryCollectionNames> {
		return this.http.get<GalleryCollectionNames>(this.galleryUrl);
	}

	public getCollectionImagesObservable(
		collectionName: string,
		startIndex: number,
		limit: number
	): Observable<PaginatedResponse<GalleryImage>> {
		return this.http.get<PaginatedResponse<GalleryImage>>(
			`${this.galleryUrl}/${encodeURIComponent(collectionName)}`,
			{ params: { startIndex, limit } }
		);
	}
}
