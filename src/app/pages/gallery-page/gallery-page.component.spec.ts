import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { environment } from 'src/environments/environment';
import { GalleryPageComponent } from './gallery-page.component';

describe('GalleryPageComponent', () => {
	const galleryUrl = `${environment.apiEndpoint}/gallery`;
	let component: GalleryPageComponent;
	let fixture: ComponentFixture<GalleryPageComponent>;
	let httpTesting: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [GalleryPageComponent],
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter([]),
				provideNoopAnimations()
			]
		});
		httpTesting = TestBed.inject(HttpTestingController);
		fixture = TestBed.createComponent(GalleryPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	afterEach(() => httpTesting.verify());

	it("describes each collection card with that collection's photo count", () => {
		httpTesting
			.expectOne(`${galleryUrl}/season-5/count`)
			.flush({ total: 12 });
		httpTesting
			.expectOne(`${galleryUrl}/season-6/count`)
			.flush({ total: 7 });

		expect(component.galleryCollections.map((c) => c.desc)).toEqual([
			'12 photos',
			'7 photos'
		]);
	});
});
