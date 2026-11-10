import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
	CountResponse,
	GalleryImage,
	PaginatedResponse
} from '../interfaces/api-responses';

@Injectable({
	providedIn: 'root'
})
export class GalleryProviderService {
	private http = inject(HttpClient);

	public getCollectionImagesObservable(
		collectionName: string,
		startIndex: number,
		limit: number
	): Observable<PaginatedResponse<GalleryImage>> {
		return this.http.get<PaginatedResponse<GalleryImage>>(
			this.collectionUrl(collectionName),
			{ params: { startIndex, limit } }
		);
	}

	public getCollectionImageCountObservable(
		collectionName: string
	): Observable<CountResponse> {
		return this.http.get<CountResponse>(
			`${this.collectionUrl(collectionName)}/count`
		);
	}

	private collectionUrl(collectionName: string): string {
		return `${environment.API_URL}/gallery/${encodeURIComponent(collectionName)}`;
	}
}
