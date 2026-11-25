import { STORAGE_KEYS } from '../../services/browser-storage/browser-storage.service';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { ToastService } from 'src/app/components/toast/toast.service';
import { SessionUser } from 'src/app/interfaces/api-responses';
import { AuthService } from 'src/app/services/auth/auth.service';

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
import { stubResizeObserver } from '../testing/resize-observer';
import { NAVBAR_HEIGHT_VARIABLE, NavbarComponent } from './navbar.component';

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

	let resize: () => void;
	const EDITOR: SessionUser = { id: '1', username: 'editor' };
	const user = signal<SessionUser | null | undefined>(undefined);
	const checkSession = vi.fn(() => of(user() ?? null));
	const logout = vi.fn();
	const show = vi.fn();

	beforeEach(async () => {
		user.set(undefined);
		localStorage.removeItem(STORAGE_KEYS.savedUser);
		checkSession.mockClear();
		logout.mockClear();
		show.mockClear();
		resize = stubResizeObserver();
		TestBed.configureTestingModule({
			imports: [NavbarComponent],
			providers: [
				provideRouter(ANY_URL_ROUTES),
				{
					provide: AuthService,
					useValue: {
						user,
						checkSession,
						logout,
						hasSavedUser: () =>
							localStorage.getItem(STORAGE_KEYS.savedUser) !==
							null
					}
				},
				{ provide: ToastService, useValue: { show } }
			]
		});
		// Resolves the lazily loaded user menu.
		await TestBed.compileComponents();
		fixture = renderComponent(NavbarComponent);
		element = fixture.nativeElement;
	});

	afterEach(() => {
		resetViewport();
		vi.unstubAllGlobals();
		document.documentElement.style.removeProperty(NAVBAR_HEIGHT_VARIABLE);
		localStorage.removeItem(STORAGE_KEYS.savedUser);
	});

	it('publishes its height for scroll padding', () => {
		const wrapper = element.querySelector<HTMLElement>(
			'.rift-navbar-wrapper'
		)!;
		vi.spyOn(wrapper, 'offsetHeight', 'get').mockReturnValue(64);

		resize();

		expect(
			document.documentElement.style.getPropertyValue(
				NAVBAR_HEIGHT_VARIABLE
			)
		).toBe('64px');
	});

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

	it('labels the site navigation', () => {
		expect(element.querySelector('nav')?.getAttribute('aria-label')).toBe(
			'Main'
		);
	});

	describe('hamburger menu', () => {
		const menuButton = () =>
			element.querySelector<HTMLButtonElement>('.hamburger-menu-button')!;

		it('starts closed with the links hidden', () => {
			expect(menuLinks()?.classList).toContain('hidden');
			expect(menuButton().getAttribute('aria-label')).toBe('Menu');
			expect(menuButton().getAttribute('aria-expanded')).toBe('false');
			expect(menuButton().getAttribute('aria-controls')).toBe(
				menuLinks()?.id
			);
		});

		it('opens when the menu button is clicked, keeping the same button', () => {
			const button = menuButton();

			click('.hamburger-menu-button');

			expect(menuLinks()?.classList).not.toContain('hidden');
			expect(element.querySelector('nav')?.classList).toContain('expand');
			expect(menuButton()).toBe(button);
			expect(button.getAttribute('aria-expanded')).toBe('true');
			expect(button.textContent?.trim()).toBe('close');
		});

		it('closes when the menu button is clicked again', () => {
			click('.hamburger-menu-button');
			click('.hamburger-menu-button');

			expect(menuLinks()?.classList).toContain('hidden');
			expect(menuButton().getAttribute('aria-expanded')).toBe('false');
		});

		it('closes on Escape and focuses the menu button', () => {
			click('.hamburger-menu-button');
			// jsdom applies the desktop media query that hides the button, and
			// won't focus hidden elements; e2e checks real focus on mobile.
			const focusSpy = vi.spyOn(menuButton(), 'focus');

			document.dispatchEvent(
				new KeyboardEvent('keydown', { key: 'Escape' })
			);
			fixture.detectChanges();

			expect(menuLinks()?.classList).toContain('hidden');
			expect(focusSpy).toHaveBeenCalled();
		});

		it('leaves focus alone on Escape while closed', () => {
			const focusSpy = vi.spyOn(menuButton(), 'focus');

			document.dispatchEvent(
				new KeyboardEvent('keydown', { key: 'Escape' })
			);

			expect(focusSpy).not.toHaveBeenCalled();
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

	describe('user menu', () => {
		const userMenu = () => element.querySelector('app-user-menu');
		const signIn = async () => {
			user.set(EDITOR);
			fixture.detectChanges();
			// The menu loads lazily.
			await fixture.whenStable();
			fixture.detectChanges();
		};

		it('is absent while the user is unknown or signed out', () => {
			expect(userMenu()).toBeNull();

			user.set(null);
			fixture.detectChanges();

			expect(userMenu()).toBeNull();
		});

		it('makes no session request for an anonymous visitor', () => {
			expect(checkSession).not.toHaveBeenCalled();
		});

		it('checks the session after rendering when a user is saved', () => {
			localStorage.setItem(
				STORAGE_KEYS.savedUser,
				JSON.stringify(EDITOR)
			);

			renderComponent(NavbarComponent);

			expect(checkSession).toHaveBeenCalledTimes(1);
		});

		it('appears once the user is known, and goes when they log out', async () => {
			await signIn();
			expect(userMenu()?.textContent).toContain('editor');

			user.set(null);
			fixture.detectChanges();

			expect(userMenu()).toBeNull();
		});

		it('closes the hamburger menu after logging out', async () => {
			await signIn();
			click('.hamburger-menu-button');

			element.querySelector<HTMLElement>('.mobile button')!.click();
			fixture.detectChanges();

			expect(menuLinks()?.classList).toContain('hidden');
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

	describe('active link', () => {
		const activeLinks = () =>
			[...element.querySelectorAll('.link-active')].map((link) =>
				link.getAttribute('href')
			);
		const navigateTo = async (url: string) => {
			await TestBed.inject(Router).navigateByUrl(url);
			fixture.detectChanges();
		};

		it('highlights only Home on the home page', async () => {
			await navigateTo('/');

			expect(activeLinks()).toEqual(['/']);
		});

		it('highlights only the current page elsewhere', async () => {
			await navigateTo('/news');

			expect(activeLinks()).toEqual(['/news']);
		});
	});

	it('navigates to the join page when Join is clicked', async () => {
		click('.join-button');
		await fixture.whenStable();

		expect(TestBed.inject(Router).url).toBe('/join');
	});
});
