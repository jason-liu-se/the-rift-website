import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environments/environment';
import {
	ICountResponse,
	IPaginatedResponse
} from '../interfaces/paginated-response.interface';
import { ICaptionCard } from '../interfaces/slideshow-image.interface';
import { GalleryProviderService } from './gallery-provider.service';

describe('GalleryProviderService', () => {
	const apiEndpoint = environment.API_URL;
	let service: GalleryProviderService;
	let httpTesting: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [provideHttpClient(), provideHttpClientTesting()]
		});
		service = TestBed.inject(GalleryProviderService);
		httpTesting = TestBed.inject(HttpTestingController);
	});

	afterEach(() => httpTesting.verify());

	it('requests a page of a collection with its total', () => {
		const page: IPaginatedResponse<ICaptionCard> = {
			items: [{ url: 'image.png', caption: 'Spawn' }],
			total: 31
		};
		let result: IPaginatedResponse<ICaptionCard> | undefined;

		service
			.getCollectionImagesObservable('season-5', 60, 30)
			.subscribe((data) => (result = data));

		const request = httpTesting.expectOne(
			`${apiEndpoint}/gallery/season-5?startIndex=60&limit=30`
		);
		expect(request.request.method).toBe('GET');
		request.flush(page);
		expect(result).toEqual(page);
	});

	it('requests the image count of a collection', () => {
		let result: ICountResponse | undefined;

		service
			.getCollectionImageCountObservable('season-6')
			.subscribe((data) => (result = data));

		const request = httpTesting.expectOne(
			`${apiEndpoint}/gallery/season-6/count`
		);
		expect(request.request.method).toBe('GET');
		request.flush({ total: 12 });
		expect(result).toEqual({ total: 12 });
	});

	it('encodes the collection name as a single path segment', () => {
		const encodedUrl = `${apiEndpoint}/gallery/a%2Fb%20c`;

		service.getCollectionImagesObservable('a/b c', 0, 30).subscribe();
		service.getCollectionImageCountObservable('a/b c').subscribe();

		// expectOne throws if no request matches, failing the test.
		expect(() => {
			httpTesting
				.expectOne(`${encodedUrl}?startIndex=0&limit=30`)
				.flush({ items: [], total: 0 });
			httpTesting.expectOne(`${encodedUrl}/count`).flush({ total: 0 });
		}).not.toThrow();
	});
});
