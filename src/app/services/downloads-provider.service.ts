import { Observable } from 'rxjs';
import { Injectable, inject } from '@angular/core';
import { DownloadCollection } from '../interfaces/api-responses';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
	providedIn: 'root'
})
export class DownloadsProviderService {
	private http = inject(HttpClient);

	public getDownloadCollections(): Observable<DownloadCollection[]> {
		return this.http.get<DownloadCollection[]>(
			`${environment.API_URL}/downloads`
		);
	}
}
