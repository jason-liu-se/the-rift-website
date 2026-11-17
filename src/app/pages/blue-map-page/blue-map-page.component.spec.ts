import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environments/environment';

import { BlueMapPageComponent } from './blue-map-page.component';

const BLUEMAP_FRAGMENT = 's6_overworld:0:0:0:1500:0:0:0:0:perspective';

function renderIframeSrc(fragment: string | null): string | null {
	TestBed.configureTestingModule({
		imports: [BlueMapPageComponent],
		providers: [
			provideHttpClient(),
			provideHttpClientTesting(),
			provideRouter([]),
			{
				provide: ActivatedRoute,
				useValue: { snapshot: { data: {}, fragment } }
			}
		]
	});
	const fixture = TestBed.createComponent(BlueMapPageComponent);
	fixture.detectChanges();
	// Runs the afterNextRender hook, then renders the iframe it enables.
	TestBed.tick();

	const iframe: HTMLIFrameElement | null =
		fixture.nativeElement.querySelector('iframe');
	return iframe?.getAttribute('src') ?? null;
}

describe('BlueMapPageComponent', () => {
	it('opens BlueMap at the view in the URL fragment', () => {
		expect(renderIframeSrc(BLUEMAP_FRAGMENT)).toBe(
			`${environment.BLUEMAP_URL}/#${BLUEMAP_FRAGMENT}`
		);
	});

	it("opens BlueMap's default view when the URL has no fragment", () => {
		expect(renderIframeSrc(null)).toBe(`${environment.BLUEMAP_URL}/`);
	});
});
