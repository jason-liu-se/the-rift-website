import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Constants } from '../config/constants';
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

	private constants: Constants = new Constants();

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
		return `${this.constants.API_ENDPOINT}/gallery/${encodeURIComponent(collectionName)}`;
	}
}
