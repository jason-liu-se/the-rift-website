import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ICaptionCard } from '../interfaces/slideshow-image.interface';
import {
	ICountResponse,
	IPaginatedResponse
} from '../interfaces/paginated-response.interface';

@Injectable({
	providedIn: 'root'
})
export class GalleryProviderService {
	private http = inject(HttpClient);

	public getCollectionImagesObservable(
		collectionName: string,
		startIndex: number,
		limit: number
	): Observable<IPaginatedResponse<ICaptionCard>> {
		return this.http.get<IPaginatedResponse<ICaptionCard>>(
			this.collectionUrl(collectionName),
			{ params: { startIndex, limit } }
		);
	}

	public getCollectionImageCountObservable(
		collectionName: string
	): Observable<ICountResponse> {
		return this.http.get<ICountResponse>(
			`${this.collectionUrl(collectionName)}/count`
		);
	}

	private collectionUrl(collectionName: string): string {
		return `${environment.API_URL}/gallery/${encodeURIComponent(collectionName)}`;
	}
}
