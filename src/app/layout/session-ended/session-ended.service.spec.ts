import { Dialog } from '@angular/cdk/dialog';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Subject, of } from 'rxjs';
import { ToastService } from 'src/app/components/toast/toast.service';
import { requireLoggedIn } from 'src/app/guards/admin-auth.guards';
import {
	AuthService,
	SessionEndReason
} from 'src/app/services/auth/auth.service';
import { SessionEndedService } from './session-ended.service';

describe('SessionEndedService', () => {
	let sessionEnded: Subject<SessionEndReason>;
	let show: ReturnType<typeof vi.fn>;
	const dialogs = () => document.querySelectorAll('[role="alertdialog"]');
	// Opening the dialog waits for its code to load.
	const dialogOpened = () =>
		vi.waitFor(() => expect(dialogs()).toHaveLength(1));

	function start(platform = 'browser') {
		sessionEnded = new Subject();
		show = vi.fn();
		TestBed.configureTestingModule({
			providers: [
				provideRouter([
					{ path: 'news', children: [] },
					{
						path: 'admin',
						canActivate: [requireLoggedIn],
						children: []
					}
				]),
				{ provide: PLATFORM_ID, useValue: platform },
				{
					provide: AuthService,
					useValue: {
						sessionEnded,
						user: () => null,
						checkSession: () => of({ id: '1', username: 'editor' })
					}
				},
				{ provide: ToastService, useValue: { show } }
			]
		});
		TestBed.inject(SessionEndedService).start();
		return TestBed.inject(Router);
	}

	afterEach(() => TestBed.resetTestingModule());

	it('shows a toast on a public page', async () => {
		await start().navigateByUrl('/news');

		sessionEnded.next('other-tab');

		expect(show).toHaveBeenCalledWith('Your session has ended');
	});

	it('shows a toast before the first navigation (a fresh load of a protected page)', () => {
		start();

		sessionEnded.next('expired');

		expect(show).toHaveBeenCalledWith('Your session has ended');
	});

	it('opens the dialog on a protected page with the reason', async () => {
		await start().navigateByUrl('/admin');

		sessionEnded.next('other-tab');
		await dialogOpened();

		expect(show).not.toHaveBeenCalled();
		expect(dialogs()[0].textContent).toContain("You've logged out");
	});

	it('opens only one dialog for two ended sessions', async () => {
		await start().navigateByUrl('/admin');

		sessionEnded.next('expired');
		sessionEnded.next('other-tab');
		await dialogOpened();
		await new Promise((resolve) => setTimeout(resolve));

		expect(dialogs()).toHaveLength(1);
	});

	it("falls back to the toast when the dialog can't be shown, and tries again next time", async () => {
		const router = start();
		await router.navigateByUrl('/admin');
		const open = vi
			.spyOn(TestBed.inject(Dialog), 'open')
			.mockImplementationOnce(() => {
				// As when its code fails to load (a deploy replaced it).
				throw new Error('Failed to fetch dynamically imported module');
			});

		sessionEnded.next('expired');
		await vi.waitFor(() =>
			expect(show).toHaveBeenCalledWith('Your session has ended')
		);
		sessionEnded.next('expired');
		await dialogOpened();

		expect(open).toHaveBeenCalledTimes(2);
	});

	it('does nothing on the server', async () => {
		await start('server').navigateByUrl('/news');

		expect(sessionEnded.observed).toBe(false);
	});
});
