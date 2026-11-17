import { Observable } from 'rxjs';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MapSeason } from '../interfaces/api-responses';
import { environment } from '../../environments/environment';

@Injectable({
	providedIn: 'root'
})
export class MapProviderService {
	private http = inject(HttpClient);

	public getMapSeasons(): Observable<MapSeason[]> {
		return this.http.get<MapSeason[]>(
			`${environment.API_URL}/maps/seasons`
		);
	}
}
