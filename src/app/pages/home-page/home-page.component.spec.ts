import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { ANY_URL_ROUTES } from 'src/app/testing/render-component';
import {
	DESKTOP_BREAKPOINT_PX,
	resetViewport,
	setInnerWidth,
	useRootFontSize
} from 'src/app/testing/viewport';
import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
	beforeEach(() => {
		useRootFontSize();
		TestBed.configureTestingModule({
			imports: [HomePageComponent],
			providers: [provideRouter(ANY_URL_ROUTES)]
		});
	});

	afterEach(resetViewport);

	function render() {
		const fixture = TestBed.createComponent(HomePageComponent);
		fixture.detectChanges();
		const element: HTMLElement = fixture.nativeElement;
		const welcomeBackground = () =>
			element.querySelector<HTMLElement>('app-welcome-card .card')!.style
				.backgroundImage;
		const resizeWindow = (width: number) => {
			setInnerWidth(width);
			window.dispatchEvent(new Event('resize'));
			fixture.detectChanges();
		};

		return { fixture, element, welcomeBackground, resizeWindow };
	}

	describe('welcome card background', () => {
		it('is shown on load below the desktop breakpoint', () => {
			setInnerWidth(DESKTOP_BREAKPOINT_PX - 1);

			expect(render().welcomeBackground()).toContain(
				'spawn-walkway-1.webp'
			);
		});

		it('is hidden on load at the desktop breakpoint', () => {
			setInnerWidth(DESKTOP_BREAKPOINT_PX);

			expect(render().welcomeBackground()).toBe('');
		});

		it('follows the window width as it is resized', () => {
			setInnerWidth(DESKTOP_BREAKPOINT_PX);
			const { welcomeBackground, resizeWindow } = render();

			resizeWindow(DESKTOP_BREAKPOINT_PX - 1);
			expect(welcomeBackground()).toContain('spawn-walkway-1.webp');

			resizeWindow(DESKTOP_BREAKPOINT_PX);
			expect(welcomeBackground()).toBe('');
		});
	});

	it.each([
		{ selector: '.primary-button', label: 'Join', url: '/join' },
		{ selector: '.secondary-button', label: 'Learn More', url: '/about' }
	])(
		'navigates to $url when $label is clicked',
		async ({ selector, label, url }) => {
			const { fixture, element } = render();
			const button = element.querySelector<HTMLButtonElement>(selector)!;

			expect(button.textContent?.trim()).toBe(label);
			button.click();
			await fixture.whenStable();

			expect(TestBed.inject(Router).url).toBe(url);
		}
	);
});
