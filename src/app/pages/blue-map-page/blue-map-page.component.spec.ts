import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';

import { BlueMapPageComponent } from './blue-map-page.component';

const BLUEMAP_FRAGMENT = 's6_overworld:0:0:0:1500:0:0:0:0:perspective';

describe('BlueMapPageComponent', () => {
	let fragment: BehaviorSubject<string | null>;
	let iframeSrc: () => string | null;

	function render(initialFragment: string | null): void {
		fragment = new BehaviorSubject(initialFragment);
		TestBed.configureTestingModule({
			imports: [BlueMapPageComponent],
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter([]),
				{ provide: ActivatedRoute, useValue: { fragment } }
			]
		});
		const fixture = TestBed.createComponent(BlueMapPageComponent);
		fixture.detectChanges();
		// Runs the afterNextRender hook, then renders the iframe it enables.
		TestBed.tick();
		iframeSrc = () =>
			fixture.nativeElement
				.querySelector('iframe')
				?.getAttribute('src') ?? null;
	}

	it('opens BlueMap at the view in the URL fragment', () => {
		render(BLUEMAP_FRAGMENT);

		expect(iframeSrc()).toBe(
			`${environment.BLUEMAP_URL}/#${BLUEMAP_FRAGMENT}`
		);
	});

	it("opens BlueMap's default view when the URL has no fragment", () => {
		render(null);

		expect(iframeSrc()).toBe(`${environment.BLUEMAP_URL}/`);
	});

	it('moves BlueMap to a new view when the URL fragment changes', () => {
		const netherFragment = 's6_nether:0:0:0:1500:0:0:0:0:perspective';
		render(BLUEMAP_FRAGMENT);

		fragment.next(netherFragment);
		TestBed.tick();

		expect(iframeSrc()).toBe(
			`${environment.BLUEMAP_URL}/#${netherFragment}`
		);
	});
});
