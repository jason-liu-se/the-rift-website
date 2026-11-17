import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { NewsPost, PaginatedResponse } from '../interfaces/api-responses';

@Injectable({
	providedIn: 'root'
})
export class NewsPostProviderService {
	private http = inject(HttpClient);

	public getNewsPosts(
		startIndex: number,
		limit: number
	): Observable<PaginatedResponse<NewsPost>> {
		return this.http.get<PaginatedResponse<NewsPost>>(
			`${environment.API_URL}/news`,
			{ params: { startIndex, limit } }
		);
	}
}
