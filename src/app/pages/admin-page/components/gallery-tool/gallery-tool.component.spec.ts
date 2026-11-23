import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ApiStatusService } from 'src/app/services/api-status/api-status.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import {
	EDITOR_GALLERY_COLLECTIONS,
	EDITOR_GALLERY_IMAGES
} from 'src/app/testing/api-fixtures';
import { environment } from 'src/environments/environment';
import { GalleryToolComponent } from './gallery-tool.component';

const EDITOR_URL = `${environment.API_URL}/editor`;

describe('GalleryToolComponent', () => {
	let harness: RouterTestingHarness;
	let httpTesting: HttpTestingController;
	const element = () => harness.routeNativeElement!;
	const button = (name: string) =>
		[...element().querySelectorAll<HTMLButtonElement>('button')].find(
			(candidate) => candidate.textContent?.trim() === name
		)!;

	beforeEach(async () => {
		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter([
					{ path: 'admin', component: GalleryToolComponent }
				]),
				{
					provide: ApiStatusService,
					useValue: { status: signal('up') }
				},
				{
					provide: AuthService,
					useValue: { user: signal({ id: '1', username: 'editor' }) }
				}
			]
		});
		httpTesting = TestBed.inject(HttpTestingController);
		harness = await RouterTestingHarness.create();
		await harness.navigateByUrl('/admin#gallery');
		httpTesting
			.expectOne(`${EDITOR_URL}/gallery/images?startIndex=0&limit=25`)
			.flush({
				items: EDITOR_GALLERY_IMAGES,
				total: EDITOR_GALLERY_IMAGES.length
			});
		httpTesting.expectOne(`${EDITOR_URL}/drafts?type=gallery`).flush([]);
		httpTesting
			.expectOne(`${EDITOR_URL}/gallery/collections`)
			.flush(EDITOR_GALLERY_COLLECTIONS);
		harness.detectChanges();
	});

	it('lists images with a thumbnail, caption, collection, and tags', () => {
		const first = element().querySelector('td.item');

		expect(first?.querySelector('img')?.getAttribute('src')).toBe(
			EDITOR_GALLERY_IMAGES[0].imageUrl
		);
		expect(first?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
			'Spawn walkway season5 · spawn'
		);
	});

	it('offers the gallery bulk actions once images are selected', () => {
		element()
			.querySelector<HTMLInputElement>(
				'input[aria-label="Select Spawn walkway"]'
			)!
			.click();
		harness.detectChanges();

		expect(button('Move')).toBeDefined();
		expect(button('Add tags')).toBeDefined();
	});

	it('shows the collections manager on request', () => {
		button('Collections').click();
		harness.detectChanges();
		httpTesting.expectOne(`${EDITOR_URL}/gallery/collections`).flush([]);

		expect(
			element().querySelector('app-collections-manager')
		).not.toBeNull();
	});

	it('switches to adding many images, and back', () => {
		button('Add many images').click();
		harness.detectChanges();
		httpTesting.expectOne(`${EDITOR_URL}/gallery/collections`).flush([]);

		expect(
			element().querySelector('app-gallery-bulk-create')
		).not.toBeNull();
	});
});
