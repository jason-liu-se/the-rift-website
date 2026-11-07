import { Observable } from 'rxjs';
import { Injectable, inject } from '@angular/core';
import { IDownloadCollection } from '../interfaces/download-collection.interface';
import { HttpClient } from '@angular/common/http';
import { Constants } from '../config/constants';

@Injectable({
	providedIn: 'root'
})
export class DownloadsProviderService {
	private http = inject(HttpClient);

	private constants: Constants = new Constants();

	public getDownloadCollections(): Observable<IDownloadCollection[]> {
		return this.http.get<IDownloadCollection[]>(
			this.constants.API_ENDPOINT + `/downloads/get-all`
		);
	}
}
