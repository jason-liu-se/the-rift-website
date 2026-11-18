import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { stubResizeObserver } from './layout/testing/resize-observer';

describe('AppComponent', () => {
	beforeEach(() => {
		stubResizeObserver();
		TestBed.configureTestingModule({
			imports: [AppComponent],
			providers: [provideRouter([])]
		});
	});

	afterEach(() => vi.unstubAllGlobals());

	it('should create the app', () => {
		const fixture = TestBed.createComponent(AppComponent);
		const app = fixture.componentInstance;
		expect(app).toBeTruthy();
	});

	it(`should have as title 'the-rift-site'`, () => {
		const fixture = TestBed.createComponent(AppComponent);
		const app = fixture.componentInstance;
		expect(app.title).toEqual('the-rift-site');
	});

	it('should render the router outlet', () => {
		const fixture = TestBed.createComponent(AppComponent);
		fixture.detectChanges();
		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.querySelector('router-outlet')).toBeTruthy();
	});

	it('renders the banners once, before the routed pages', () => {
		const fixture = TestBed.createComponent(AppComponent);
		fixture.detectChanges();
		const compiled = fixture.nativeElement as HTMLElement;

		expect(compiled.querySelectorAll('app-banner')).toHaveLength(1);
		expect(compiled.firstElementChild?.tagName).toBe('APP-BANNER');
	});
});
