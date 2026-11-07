import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Constants } from '../config/constants';
import { ICaptionCard } from '../interfaces/slideshow-image.interface';

@Injectable({
	providedIn: 'root'
})
export class GalleryProviderService {
	private http = inject(HttpClient);

	private constants: Constants;

	constructor() {
		this.constants = new Constants();
	}

	public getCollectionImagesObservable(
		collectionName: string,
		startIndex: number,
		numItems: number
	): Observable<ICaptionCard[]> {
		return this.http.get<ICaptionCard[]>(
			this.constants.API_ENDPOINT +
				`/gallery/get-collection?collection=${collectionName}&&startIndex=${startIndex}&&limit=${numItems}`
		);
	}

	public getCollectionImageCountObservable(
		collectionName: string
	): Observable<{ count: number }> {
		return this.http.get<{ count: number }>(
			this.constants.API_ENDPOINT +
				`/gallery/count-collection-items?collection=${collectionName}`,
			{
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
	}
}
