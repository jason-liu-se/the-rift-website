import { Observable } from 'rxjs';
import { Injectable, inject } from '@angular/core';
import { IDownloadCollection } from '../interfaces/download-collection.interface';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
	providedIn: 'root'
})
export class DownloadsProviderService {
	private http = inject(HttpClient);

	public getDownloadCollections(): Observable<IDownloadCollection[]> {
		return this.http.get<IDownloadCollection[]>(
			`${environment.API_URL}/downloads`
		);
	}
}
