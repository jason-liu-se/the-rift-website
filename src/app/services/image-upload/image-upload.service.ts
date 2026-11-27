import {
	HttpClient,
	HttpEventType,
	HttpUploadProgressEvent
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, filter, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ImageUploadForm } from '../../interfaces/api-requests';
import { ImageUploadResponse } from '../../interfaces/api-responses';

/** An upload's progress (0 to 1), then its result per file. */
export type ImageUploadEvent =
	| { type: 'progress'; fraction: number }
	| { type: 'done'; response: ImageUploadResponse };

/**
 * Uploads images to imgbb through the API (`POST /editor/images`, logged in),
 * sorted into `album`. One request of at most MAX_UPLOAD_FILES files.
 */
@Injectable({
	providedIn: 'root'
})
export class ImageUploadService {
	private http = inject(HttpClient);
	private uploadUrl = `${environment.API_URL}/editor/images`;

	public uploadImages(
		files: readonly File[],
		album: ImageUploadForm
	): Observable<ImageUploadEvent> {
		const body = new FormData();
		for (const [name, value] of Object.entries(album)) {
			body.append(name, value);
		}
		for (const file of files) {
			body.append('files', file, file.name);
		}
		return this.http
			.post<ImageUploadResponse>(this.uploadUrl, body, {
				withCredentials: true,
				reportProgress: true,
				observe: 'events'
			})
			.pipe(
				filter(
					(event) =>
						event.type === HttpEventType.UploadProgress ||
						event.type === HttpEventType.Response
				),
				map((event): ImageUploadEvent => {
					if (event.type === HttpEventType.Response) {
						return { type: 'done', response: event.body! };
					}
					const { loaded, total } = event as HttpUploadProgressEvent;
					return {
						type: 'progress',
						fraction: total ? loaded / total : 0
					};
				})
			);
	}
}
