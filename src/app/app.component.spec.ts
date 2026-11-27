import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { SessionEndedService } from './core/layout/session-ended/session-ended.service';

describe('AppComponent', () => {
	beforeEach(() =>
		TestBed.configureTestingModule({
			imports: [AppComponent],
			providers: [provideRouter([])]
		})
	);

	it('starts telling the user when their session ends', () => {
		const start = vi
			.spyOn(TestBed.inject(SessionEndedService), 'start')
			.mockImplementation(() => undefined);

		TestBed.createComponent(AppComponent);

		expect(start).toHaveBeenCalled();
	});

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
});
