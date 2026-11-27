import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import {
	ANY_URL_ROUTES,
	renderComponent
} from 'src/app/testing/render-component';
import { BackButtonComponent } from './back-button.component';

describe('BackButtonComponent', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [BackButtonComponent],
			providers: [provideRouter(ANY_URL_ROUTES)]
		});
	});

	it('shows the title', () => {
		const fixture = renderComponent(BackButtonComponent, {
			destination: '/gallery',
			title: 'Back to gallery'
		});

		expect(fixture.nativeElement.textContent).toContain('Back to gallery');
	});

	it('navigates to the destination when clicked', async () => {
		const fixture = renderComponent(BackButtonComponent, {
			destination: '/gallery',
			title: 'Back to gallery'
		});

		fixture.nativeElement.querySelector('button').click();
		await fixture.whenStable();

		expect(TestBed.inject(Router).url).toBe('/gallery');
	});
});
