import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environments/environment';

import { BlueMapPageComponent } from './blue-map-page.component';

const CAMERA_HASH = ':0:0:0:1500:0:0:0:0:perspective';

function renderIframeSrc(routeData: Record<string, unknown>): string | null {
	TestBed.configureTestingModule({
		imports: [BlueMapPageComponent],
		providers: [
			provideHttpClient(),
			provideHttpClientTesting(),
			provideRouter([]),
			provideNoopAnimations(),
			{
				provide: ActivatedRoute,
				useValue: { snapshot: { data: routeData } }
			}
		]
	});
	const fixture = TestBed.createComponent(BlueMapPageComponent);
	fixture.detectChanges();

	const iframe: HTMLIFrameElement | null =
		fixture.nativeElement.querySelector('iframe');
	return iframe?.getAttribute('src') ?? null;
}

describe('BlueMapPageComponent', () => {
	it('embeds the BlueMap map named in the route data', () => {
		expect(renderIframeSrc({ mapName: 'world' })).toBe(
			`${environment.bluemapUrl}/#world${CAMERA_HASH}`
		);
	});

	it('embeds the default BlueMap map when the route names none', () => {
		expect(renderIframeSrc({})).toBe(
			`${environment.bluemapUrl}/#${CAMERA_HASH}`
		);
	});
});
