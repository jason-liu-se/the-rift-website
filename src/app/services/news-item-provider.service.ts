import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Constants } from '../config/constants';
import { INewsItem } from '../interfaces/news-item.interface';

@Injectable({
	providedIn: 'root'
})
export class NewsItemProviderService {
	private http = inject(HttpClient);

	private constants: Constants = new Constants();

	public getNewsItems(
		startIndex: number,
		numItems: number
	): Observable<INewsItem[]> {
		return this.http.get<INewsItem[]>(
			this.constants.API_ENDPOINT +
				`/news/get-items?startIndex=${startIndex}&&limit=${numItems}`
		);
	}

	public countNewsItems(): Observable<{ count: number }> {
		return this.http.get<{ count: number }>(
			this.constants.API_ENDPOINT + `/news/count-items`
		);
	}
}
