import { provideHttpClient } from '@angular/common/http';
import {
	HttpTestingController,
	provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { routes } from 'src/app/app.routes';
import { MAP_SEASONS } from 'src/app/testing/api-fixtures';
import { environment } from 'src/environments/environment';
import { MapPageComponent } from './map-page.component';

describe('MapPageComponent', () => {
	let httpTesting: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [MapPageComponent],
			providers: [
				provideRouter([]),
				provideHttpClient(),
				provideHttpClientTesting()
			]
		});
		httpTesting = TestBed.inject(HttpTestingController);
	});

	afterEach(() => httpTesting.verify());

	it('renders a section per season opening each dimension in the map viewer', () => {
		const fixture = TestBed.createComponent(MapPageComponent);
		fixture.detectChanges();

		httpTesting
			.expectOne(`${environment.API_URL}/maps/seasons`)
			.flush(MAP_SEASONS);
		fixture.detectChanges();

		const element: HTMLElement = fixture.nativeElement;
		const routePaths = routes.map((route) => `/${route.path}`);
		const sections = element.querySelectorAll('app-section-card');
		const cards = [...element.querySelectorAll('.collection-card')];
		const hrefs = cards.map((card) =>
			card.querySelector('a')?.getAttribute('href')
		);

		expect(
			[...sections].map((s) => s.querySelector('h2')?.textContent?.trim())
		).toEqual(['Season 5']);
		expect(
			cards.map((card) => card.querySelector('h3')?.textContent)
		).toEqual(['Overworld', 'Nether', 'End']);
		expect(hrefs).toEqual([
			'/map/viewer#season_5_overworld:0:0:0:1500:0:0:0:0:perspective',
			'/map/viewer#season_5_nether:0:0:0:1500:0:0:0:0:perspective',
			'/map/viewer#season_5_end:0:0:0:1500:0:0:0:0:perspective'
		]);
		expect(routePaths).toContain('/map/viewer');
	});

	it('shows an error state when the request fails, and loads again on Try again', () => {
		const url = `${environment.API_URL}/maps/seasons`;
		const fixture = TestBed.createComponent(MapPageComponent);
		const element: HTMLElement = fixture.nativeElement;
		fixture.detectChanges();

		httpTesting
			.expectOne(url)
			.flush(null, { status: 503, statusText: 'Unavailable' });
		fixture.detectChanges();

		expect(element.querySelector('app-error-state h2')?.textContent).toBe(
			"Couldn't load the maps"
		);

		element
			.querySelector<HTMLButtonElement>('app-error-state button')!
			.click();
		fixture.detectChanges();
		httpTesting.expectOne(url).flush(MAP_SEASONS);
		fixture.detectChanges();

		expect(element.querySelector('app-error-state')).toBeNull();
		expect(element.querySelectorAll('app-section-card')).toHaveLength(1);
	});
});
