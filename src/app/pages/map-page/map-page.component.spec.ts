import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { routes } from 'src/app/app.routes';
import { MapPageComponent } from './map-page.component';

describe('MapPageComponent', () => {
	it('links an always-described card to each map route', () => {
		TestBed.configureTestingModule({
			imports: [MapPageComponent],
			providers: [provideRouter([])]
		});
		const fixture = TestBed.createComponent(MapPageComponent);
		fixture.detectChanges();
		const element: HTMLElement = fixture.nativeElement;
		const routePaths = routes.map((route) => `/${route.path}`);

		const hrefs = [...element.querySelectorAll('.collection-card a')].map(
			(link) => link.getAttribute('href')
		);
		const descriptions = [
			...element.querySelectorAll('.collection-card .description')
		];

		expect(hrefs).toEqual([
			'/map/season-5-overworld',
			'/map/season-5-nether',
			'/map/season-5-end'
		]);
		hrefs.forEach((href) => expect(routePaths).toContain(href));
		expect(descriptions.map((p) => p.textContent?.trim())).toEqual([
			'Overworld',
			'Nether',
			'End'
		]);
		descriptions.forEach((p) =>
			expect(p.classList).toContain('high-contrast')
		);
	});
});
