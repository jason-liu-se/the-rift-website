import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Constants } from '../config/constants';
import { INewsItem } from '../interfaces/news-item.interface';
import { IPaginatedResponse } from '../interfaces/paginated-response.interface';

@Injectable({
	providedIn: 'root'
})
export class NewsItemProviderService {
	private http = inject(HttpClient);

	private constants: Constants = new Constants();

	public getNewsItems(
		startIndex: number,
		limit: number
	): Observable<IPaginatedResponse<INewsItem>> {
		return this.http.get<IPaginatedResponse<INewsItem>>(
			`${this.constants.API_ENDPOINT}/news`,
			{ params: { startIndex, limit } }
		);
	}
}
