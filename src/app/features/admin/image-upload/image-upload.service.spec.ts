import { HttpEventType, provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environments/environment';
import { ImageUploadEvent, ImageUploadService } from './image-upload.service';

describe('ImageUploadService', () => {
	it('posts the files and album as multipart, with progress, then the results', () => {
		TestBed.configureTestingModule({
			providers: [provideHttpClient(), provideHttpClientTesting()]
		});
		const events: ImageUploadEvent[] = [];
		const file = new File(['png'], 'spawn.png', { type: 'image/png' });

		TestBed.inject(ImageUploadService)
			.uploadImages([file], { album: 'gallery', collection: 'season5' })
			.subscribe((event) => events.push(event));
		const request = TestBed.inject(HttpTestingController).expectOne(
			`${environment.API_URL}/editor/images`
		);
		const body = request.request.body as FormData;
		expect(request.request.method).toBe('POST');
		expect(request.request.withCredentials).toBe(true);
		expect(body.get('album')).toBe('gallery');
		expect(body.get('collection')).toBe('season5');
		expect((body.get('files') as File).name).toBe('spawn.png');

		request.event({
			type: HttpEventType.UploadProgress,
			loaded: 1,
			total: 4
		});
		const response = {
			results: [
				{ name: 'spawn.png', url: 'https://i.ibb.co/a/spawn.png' }
			]
		};
		request.flush(response);

		expect(events).toEqual([
			{ type: 'progress', fraction: 0.25 },
			{ type: 'done', response }
		]);
	});
});
