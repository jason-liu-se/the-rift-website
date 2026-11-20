import { Dialog } from '@angular/cdk/dialog';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { requireLoggedIn } from 'src/app/guards/admin-auth.guards';
import { LOGIN_RETURN_URL_KEY } from 'src/app/guards/login-return-url';
import { SessionUser } from 'src/app/interfaces/api-responses';
import {
	AuthService,
	SessionEndReason
} from 'src/app/services/auth/auth.service';
import {
	SESSION_ENDED_DIALOG_CONFIG,
	SessionEndedDialogComponent
} from './session-ended-dialog.component';

describe('SessionEndedDialogComponent', () => {
	const user = signal<SessionUser | null | undefined>(null);
	const dialog = () =>
		document.querySelector<HTMLElement>('[role="alertdialog"]');
	const button = (name: string) =>
		[...dialog()!.querySelectorAll('button')].find(
			(element) => element.textContent?.trim() === name
		)!;

	async function open(reason: SessionEndReason = 'expired', url = '/admin') {
		TestBed.configureTestingModule({
			providers: [
				provideRouter([
					{
						path: 'admin',
						canActivate: [requireLoggedIn],
						children: []
					},
					{ path: '**', children: [] }
				]),
				{
					provide: AuthService,
					// The guard lets the editor in; `user` is what the dialog watches.
					useValue: {
						user,
						checkSession: () => of({ id: '1', username: 'editor' })
					}
				}
			]
		});
		await TestBed.inject(Router).navigateByUrl(url);
		TestBed.inject(Dialog).open(SessionEndedDialogComponent, {
			...SESSION_ENDED_DIALOG_CONFIG,
			data: reason
		});
		TestBed.tick();
		// Focus moves once the dialog has rendered.
		await new Promise((resolve) => setTimeout(resolve));
	}

	beforeEach(() => {
		sessionStorage.clear();
		user.set(null);
	});
	afterEach(() => {
		vi.restoreAllMocks();
		TestBed.resetTestingModule();
	});

	it.each<[SessionEndReason, string, string]>([
		[
			'expired',
			'Your session has ended',
			"For your security, you've been logged out. Log in again to keep editing."
		],
		[
			'other-tab',
			"You've logged out",
			'You logged out in another tab. Log in again to keep editing.'
		]
	])('shows the heading and text for %s', async (reason, heading, text) => {
		await open(reason);

		const labelledBy = dialog()!.getAttribute('aria-labelledby')!;
		const describedBy = dialog()!.getAttribute('aria-describedby')!;
		expect(document.getElementById(labelledBy)?.textContent?.trim()).toBe(
			heading
		);
		expect(document.getElementById(describedBy)?.textContent?.trim()).toBe(
			text
		);
	});

	it('focuses Log in again', async () => {
		await open();

		expect(document.activeElement).toBe(button('Log in again'));
	});

	it('stays open on Escape and on a backdrop click', async () => {
		await open();

		dialog()!.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
		);
		document.querySelector<HTMLElement>('.cdk-overlay-backdrop')?.click();
		TestBed.tick();

		expect(dialog()).not.toBeNull();
	});

	it('stays open on the browser Back button', async () => {
		await open();

		window.dispatchEvent(new PopStateEvent('popstate'));
		TestBed.tick();

		expect(dialog()).not.toBeNull();
	});

	it('stays open going back to another admin tool', async () => {
		await open('expired', '/admin#news');

		await TestBed.inject(Router).navigateByUrl('/admin#downloads');

		expect(dialog()).not.toBeNull();
	});

	it('closes going back to a page that needs no login', async () => {
		await open();

		await TestBed.inject(Router).navigateByUrl('/news');

		expect(dialog()).toBeNull();
	});

	it('blocks scrolling of the page behind', async () => {
		// Scrolling is only blocked on a page taller than the window.
		vi.spyOn(
			document.documentElement,
			'scrollHeight',
			'get'
		).mockReturnValue(window.innerHeight + 1);
		await open();

		expect(
			document.documentElement.classList.contains(
				'cdk-global-scrollblock'
			)
		).toBe(true);
	});

	it('Log in again saves the current page and goes to the login page', async () => {
		await open('expired', '/admin#news');

		button('Log in again').click();
		await new Promise((resolve) => setTimeout(resolve));

		expect(sessionStorage.getItem(LOGIN_RETURN_URL_KEY)).toBe(
			'/admin#news'
		);
		expect(TestBed.inject(Router).url).toBe('/admin/login');
		expect(dialog()).toBeNull();
	});

	it('Go to the home page goes home without saving', async () => {
		await open();

		button('Go to the home page').click();
		await new Promise((resolve) => setTimeout(resolve));

		expect(sessionStorage.getItem(LOGIN_RETURN_URL_KEY)).toBeNull();
		expect(TestBed.inject(Router).url).toBe('/');
		expect(dialog()).toBeNull();
	});

	it('closes when the user logs back in elsewhere', async () => {
		await open();

		user.set({ id: '1', username: 'editor' });
		TestBed.tick();

		expect(dialog()).toBeNull();
	});
});
