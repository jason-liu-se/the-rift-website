import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { SessionEndWatcher } from './core/layout/session-ended/session-end-watcher';

describe('App', () => {
	beforeEach(() =>
		TestBed.configureTestingModule({
			imports: [App],
			providers: [provideRouter([])]
		})
	);

	it('starts telling the user when their session ends', () => {
		const start = vi
			.spyOn(TestBed.inject(SessionEndWatcher), 'start')
			.mockImplementation(() => undefined);

		TestBed.createComponent(App);

		expect(start).toHaveBeenCalled();
	});

	it('should create the app', () => {
		const fixture = TestBed.createComponent(App);
		const app = fixture.componentInstance;
		expect(app).toBeTruthy();
	});

	it(`should have as title 'the-rift-site'`, () => {
		const fixture = TestBed.createComponent(App);
		const app = fixture.componentInstance;
		expect(app.title).toEqual('the-rift-site');
	});

	it('should render the router outlet', () => {
		const fixture = TestBed.createComponent(App);
		fixture.detectChanges();
		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.querySelector('router-outlet')).toBeTruthy();
	});
});
