import { Observable } from 'rxjs';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MapSeason } from '../../core/api/api-responses';
import { environment } from '../../../environments/environment';

@Injectable({
	providedIn: 'root'
})
export class MapsApi {
	private http = inject(HttpClient);

	public getMapSeasons(): Observable<MapSeason[]> {
		return this.http.get<MapSeason[]>(
			`${environment.API_URL}/maps/seasons`
		);
	}
}
