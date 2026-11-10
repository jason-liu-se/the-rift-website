import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import {
	ANY_URL_ROUTES,
	renderComponent
} from 'src/app/testing/render-component';
import {
	DESKTOP_BREAKPOINT_PX,
	resetViewport,
	setInnerWidth,
	useRootFontSize
} from 'src/app/testing/viewport';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
	let fixture: ComponentFixture<NavbarComponent>;
	let element: HTMLElement;

	const menuLinks = () => element.querySelector('.menu-links.center-align');
	const click = (selector: string) => {
		const target = element.querySelector<HTMLElement>(selector);
		if (!target) {
			throw new Error(`No element matches ${selector}`);
		}
		target.click();
		fixture.detectChanges();
	};
	const resizeWindow = (width: number) => {
		setInnerWidth(width);
		window.dispatchEvent(new Event('resize'));
		fixture.detectChanges();
	};

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [NavbarComponent],
			providers: [provideRouter(ANY_URL_ROUTES)]
		});
		fixture = renderComponent(NavbarComponent);
		element = fixture.nativeElement;
	});

	afterEach(resetViewport);

	describe('transparent', () => {
		it('is see-through with no spacer by default', () => {
			expect(
				element.querySelector('.rift-navbar-wrapper')?.classList
			).not.toContain('opaque');
			expect(element.querySelector('.edge-padding')).toBeNull();
		});

		it('is opaque with a spacer when false', () => {
			element = renderComponent(NavbarComponent, {
				transparent: false
			}).nativeElement;

			expect(
				element.querySelector('.rift-navbar-wrapper')?.classList
			).toContain('opaque');
			expect(element.querySelector('.edge-padding')).not.toBeNull();
		});
	});

	describe('hamburger menu', () => {
		it('starts closed with the links hidden', () => {
			expect(menuLinks()?.classList).toContain('hidden');
			expect(
				element.querySelector('.hamburger-menu-button')
			).not.toBeNull();
			expect(
				element.querySelector('.close-hamburger-menu-button')
			).toBeNull();
		});

		it('opens when the menu button is clicked', () => {
			click('.hamburger-menu-button');

			expect(menuLinks()?.classList).not.toContain('hidden');
			expect(element.querySelector('nav')?.classList).toContain('expand');
			expect(element.querySelector('.hamburger-menu-button')).toBeNull();
		});

		it('closes when the close button is clicked', () => {
			click('.hamburger-menu-button');
			click('.close-hamburger-menu-button');

			expect(menuLinks()?.classList).toContain('hidden');
			expect(
				element.querySelector('.hamburger-menu-button')
			).not.toBeNull();
		});

		describe('on window resize', () => {
			beforeEach(() => {
				useRootFontSize();
				click('.hamburger-menu-button');
			});

			it('closes at the desktop breakpoint', () => {
				resizeWindow(DESKTOP_BREAKPOINT_PX);

				expect(menuLinks()?.classList).toContain('hidden');
			});

			it('stays open below the desktop breakpoint', () => {
				resizeWindow(DESKTOP_BREAKPOINT_PX - 1);

				expect(menuLinks()?.classList).not.toContain('hidden');
			});
		});
	});

	it('links to each page', () => {
		const hrefs = [...element.querySelectorAll('a')].map((link) =>
			link.getAttribute('href')
		);

		expect(hrefs).toEqual([
			'/',
			'/',
			'/news',
			'/gallery',
			'/map',
			'/downloads',
			'/about',
			'/contact'
		]);
	});

	it('navigates to the join page when Join is clicked', async () => {
		click('.join-button');
		await fixture.whenStable();

		expect(TestBed.inject(Router).url).toBe('/join');
	});
});
