import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ToastService } from 'src/app/shared/ui/toast/toast.service';
import { requireLoggedIn } from 'src/app/core/auth/admin-auth.guards';
import { AuthService } from 'src/app/core/auth/auth.service';
import { FocusRecoveryService } from 'src/app/core/focus-recovery/focus-recovery.service';
import { ANY_URL_ROUTES } from 'src/app/testing/render-component';
import { UserMenuComponent } from './user-menu.component';

describe('UserMenuComponent', () => {
	const logout = vi.fn();
	const show = vi.fn();
	let fixture: ComponentFixture<UserMenuComponent>;
	let element: HTMLElement;

	const trigger = () =>
		element.querySelector<HTMLButtonElement>('.user-button')!;
	const panel = () => element.querySelector('.panel');
	const logoutButton = () =>
		element.querySelector<HTMLElement>('.menu-item[value="logout"]')!;
	const settle = async () => {
		fixture.detectChanges();
		await fixture.whenStable();
		fixture.detectChanges();
	};
	const key = async (target: HTMLElement, name: string) => {
		target.dispatchEvent(
			new KeyboardEvent('keydown', { key: name, bubbles: true })
		);
		await settle();
	};
	const open = () => {
		trigger().click();
		fixture.detectChanges();
	};
	/** Opens the menu on `url` and presses Log out. */
	const logOutFrom = async (url: string) => {
		await TestBed.inject(Router).navigateByUrl(url);
		open();
		logoutButton().click();
		await settle();
	};

	beforeEach(() => {
		logout.mockClear();
		show.mockClear();
		TestBed.configureTestingModule({
			providers: [
				provideRouter([
					{
						path: 'admin',
						canActivate: [requireLoggedIn],
						children: []
					},
					...ANY_URL_ROUTES
				]),
				{
					provide: AuthService,
					useValue: {
						logout,
						// The protected page's guard sees a signed-in user.
						checkSession: () => of({ id: '1', username: 'editor' }),
						user: signal({ id: '1', username: 'editor' })
					}
				},
				{ provide: ToastService, useValue: { show } }
			]
		});
		fixture = TestBed.createComponent(UserMenuComponent);
		fixture.detectChanges();
		element = fixture.nativeElement;
	});

	it('shows the avatar alone on the button', () => {
		expect(trigger().getAttribute('aria-label')).toBe('Account menu');
		expect(trigger().getAttribute('aria-expanded')).toBe('false');
		expect(trigger().querySelector('.avatar')?.textContent).toContain('E');
		expect(trigger().querySelector('.username')).toBeNull();
	});

	it('opens a menu with the user, Admin and Log out', () => {
		open();

		expect(trigger().getAttribute('aria-expanded')).toBe('true');
		expect(panel()?.classList).toContain('open');
		expect(panel()?.querySelector('.panel-header')?.textContent).toContain(
			'editor'
		);
		expect(
			panel()?.querySelector('a[href="/admin"]')?.textContent
		).toContain('Admin');
		expect(logoutButton().textContent).toContain('Log out');
	});

	it('also lists the user, Admin and Log out for the hamburger menu', () => {
		const mobile = element.querySelector('.mobile');

		expect(mobile?.textContent).toContain('editor');
		expect(mobile?.querySelector('a')?.getAttribute('href')).toBe('/admin');
		expect(mobile?.querySelector('button')?.textContent).toContain(
			'Log out'
		);
	});

	describe('keyboard', () => {
		it('opens with Enter, ArrowDown or Space, and closes with Escape', async () => {
			for (const name of ['Enter', 'ArrowDown', ' ']) {
				await key(trigger(), name);
				expect(trigger().getAttribute('aria-expanded')).toBe('true');
				await key(trigger(), 'Escape');
				expect(trigger().getAttribute('aria-expanded')).toBe('false');
			}
		});

		it('returns focus to the button when Escape closes it', async () => {
			await key(trigger(), 'Enter');
			await key(trigger(), 'Escape');

			expect(document.activeElement).toBe(trigger());
		});

		it('moves through the items with the arrow keys', async () => {
			await key(trigger(), 'Enter');
			const items = [...element.querySelectorAll('.menu-item')];
			expect(items[0].getAttribute('data-active')).toBe('true');

			await key(
				element.querySelector<HTMLElement>('.menu')!,
				'ArrowDown'
			);

			expect(items[1].getAttribute('data-active')).toBe('true');
		});
	});

	describe('Log out', () => {
		it('logs out at once, stays on a public page, shows a toast and tells the navbar', async () => {
			const loggedOut = vi.fn();
			fixture.componentInstance.loggedOut.subscribe(loggedOut);

			await logOutFrom('/news');

			expect(logout).toHaveBeenCalledTimes(1);
			expect(show).toHaveBeenCalledWith("You've logged out");
			expect(loggedOut).toHaveBeenCalled();
			expect(TestBed.inject(Router).url).toBe('/news');
		});

		it('recovers focus once the menu is gone, so it does not fall to <body>', async () => {
			const recover = vi.spyOn(
				TestBed.inject(FocusRecoveryService),
				'recoverAfterRender'
			);

			await logOutFrom('/news');

			expect(recover).toHaveBeenCalledOnce();
		});

		it('leaves focus to the navigation when going to the login page', async () => {
			const recover = vi.spyOn(
				TestBed.inject(FocusRecoveryService),
				'recoverAfterRender'
			);

			await logOutFrom('/admin');

			expect(recover).not.toHaveBeenCalled();
		});

		it('goes to the login page from a protected page', async () => {
			await logOutFrom('/admin');

			expect(logout).toHaveBeenCalledTimes(1);
			expect(show).not.toHaveBeenCalled();
			expect(TestBed.inject(Router).url).toBe('/admin/login');
		});

		it('works the same from the hamburger menu', async () => {
			await TestBed.inject(Router).navigateByUrl('/news');

			element.querySelector<HTMLElement>('.mobile button')!.click();
			await settle();

			expect(logout).toHaveBeenCalledTimes(1);
			expect(show).toHaveBeenCalledWith("You've logged out");
		});
	});
});
