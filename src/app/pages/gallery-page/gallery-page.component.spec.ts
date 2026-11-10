import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { routes } from 'src/app/app.routes';
import { environment } from 'src/environments/environment';
import { GalleryPageComponent } from './gallery-page.component';

describe('GalleryPageComponent', () => {
	const galleryUrl = `${environment.API_URL}/gallery`;
	let fixture: ComponentFixture<GalleryPageComponent>;
	let element: HTMLElement;
	let httpTesting: HttpTestingController;

	const descriptions = () =>
		[...element.querySelectorAll('.collection-card .description')].map(
			(p) => p.textContent?.trim()
		);
	const flushCounts = (season5: number, season6: number) => {
		httpTesting
			.expectOne(`${galleryUrl}/season-5/count`)
			.flush({ total: season5 });
		httpTesting
			.expectOne(`${galleryUrl}/season-6/count`)
			.flush({ total: season6 });
		fixture.detectChanges();
	};

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [GalleryPageComponent],
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter([])
			]
		});
		httpTesting = TestBed.inject(HttpTestingController);
		fixture = TestBed.createComponent(GalleryPageComponent);
		element = fixture.nativeElement;
		fixture.detectChanges();
	});

	afterEach(() => httpTesting.verify());

	it('links a card to each gallery collection route', () => {
		flushCounts(0, 0);
		const routePaths = routes.map((route) => `/${route.path}`);
		const hrefs = [...element.querySelectorAll('.collection-card a')].map(
			(link) => link.getAttribute('href')
		);

		expect(hrefs).toEqual(['/gallery/season-5', '/gallery/season-6']);
		hrefs.forEach((href) => expect(routePaths).toContain(href));
	});

	it("shows each collection's photo count once loaded", () => {
		expect(descriptions()).toEqual([]);

		flushCounts(12, 7);

		expect(descriptions()).toEqual(['12 photos', '7 photos']);
	});
});
