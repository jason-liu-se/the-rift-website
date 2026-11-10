import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { NewsItem, PaginatedResponse } from '../interfaces/api-responses';

@Injectable({
	providedIn: 'root'
})
export class NewsItemProviderService {
	private http = inject(HttpClient);

	public getNewsItems(
		startIndex: number,
		limit: number
	): Observable<PaginatedResponse<NewsItem>> {
		return this.http.get<PaginatedResponse<NewsItem>>(
			`${environment.API_URL}/news`,
			{ params: { startIndex, limit } }
		);
	}
}
