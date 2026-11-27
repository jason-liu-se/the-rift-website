import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import {
	ANY_URL_ROUTES,
	renderComponent
} from 'src/app/testing/render-component';
import { BackButton } from './back-button';

describe('BackButton', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [BackButton],
			providers: [provideRouter(ANY_URL_ROUTES)]
		});
	});

	it('shows the title', () => {
		const fixture = renderComponent(BackButton, {
			destination: '/gallery',
			title: 'Back to gallery'
		});

		expect(fixture.nativeElement.textContent).toContain('Back to gallery');
	});

	it('navigates to the destination when clicked', async () => {
		const fixture = renderComponent(BackButton, {
			destination: '/gallery',
			title: 'Back to gallery'
		});

		fixture.nativeElement.querySelector('button').click();
		await fixture.whenStable();

		expect(TestBed.inject(Router).url).toBe('/gallery');
	});
});
