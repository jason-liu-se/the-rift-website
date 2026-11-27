import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { ANY_URL_ROUTES } from 'src/app/testing/render-component';
import { ErrorPage } from './error-page';

describe('ErrorPage', () => {
	it('says the page was not found and links home', async () => {
		TestBed.configureTestingModule({
			providers: [provideRouter(ANY_URL_ROUTES)]
		});
		const router = TestBed.inject(Router);
		await router.navigateByUrl('/not-a-page');
		const fixture = TestBed.createComponent(ErrorPage);
		fixture.detectChanges();
		const element: HTMLElement = fixture.nativeElement;
		const link = element.querySelector('a')!;

		expect(element.querySelector('h1')?.textContent).toBe(
			'404: Page not found'
		);
		expect(element.querySelector('button')).toBeNull();
		expect(link.textContent?.trim()).toBe('Back to Home');

		link.click();
		await fixture.whenStable();

		expect(router.url).toBe('/');
	});
});
