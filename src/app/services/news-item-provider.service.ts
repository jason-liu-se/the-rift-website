import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { INewsItem } from '../interfaces/news-item.interface';
import { IPaginatedResponse } from '../interfaces/paginated-response.interface';

@Injectable({
	providedIn: 'root'
})
export class NewsItemProviderService {
	private http = inject(HttpClient);

	public getNewsItems(
		startIndex: number,
		limit: number
	): Observable<IPaginatedResponse<INewsItem>> {
		return this.http.get<IPaginatedResponse<INewsItem>>(
			`${environment.API_URL}/news`,
			{ params: { startIndex, limit } }
		);
	}
}
