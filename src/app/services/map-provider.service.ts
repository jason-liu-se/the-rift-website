import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface HttpRequestOptions {
	headers?: HttpHeaders | Record<string, string | string[]>;
	params?:
		| HttpParams
		| Record<
				string,
				| string
				| number
				| boolean
				| readonly (string | number | boolean)[]
		  >;
	withCredentials?: boolean;
}

@Injectable({
	providedIn: 'root'
})
export class MapProviderService {
	private http = inject(HttpClient);

	public get<T>(url: string, options?: HttpRequestOptions): Observable<T> {
		return this.http.get<T>(url, options);
	}

	public post<T>(
		url: string,
		data: unknown,
		options?: HttpRequestOptions
	): Observable<T> {
		return this.http.post<T>(url, data, options);
	}

	public put<T>(
		url: string,
		data: unknown,
		options?: HttpRequestOptions
	): Observable<T> {
		return this.http.put<T>(url, data, options);
	}

	public delete<T>(url: string, options?: HttpRequestOptions): Observable<T> {
		return this.http.delete<T>(url, options);
	}
}
