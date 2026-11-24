import { STORAGE_KEYS } from '../../services/browser-storage/browser-storage.service';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Subject, of } from 'rxjs';
import { requireLoggedIn } from 'src/app/guards/admin-auth.guards';
import {
	AuthService,
	SessionEndReason
} from 'src/app/services/auth/auth.service';
import { SessionEndedNotifier } from './session-ended-notifier';
import { SessionEndedService } from './session-ended.service';

describe('SessionEndedService', () => {
	let sessionEnded: Subject<SessionEndReason>;
	let notify: ReturnType<typeof vi.fn>;

	function start(platform = 'browser') {
		sessionEnded = new Subject();
		notify = vi.fn();
		TestBed.configureTestingModule({
			providers: [
				provideRouter([
					{ path: 'news', children: [] },
					{ path: 'admin/login', children: [] },
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
						checkSession: () => of({ id: '1', username: 'editor' })
					}
				},
				{ provide: SessionEndedNotifier, useValue: { notify } }
			]
		});
		TestBed.inject(SessionEndedService).start();
		return TestBed.inject(Router);
	}

	beforeEach(() => sessionStorage.clear());
	afterEach(() => TestBed.resetTestingModule());

	it.each<[string, string | null, boolean]>([
		['a public page', '/news', false],
		['a protected page', '/admin', true],
		// A fresh load of a protected page: requireLoggedIn then redirects.
		['no page yet', null, false]
	])(
		'tells the notifier the reason, on %s',
		async (_, url, protectedPage) => {
			const router = start();
			if (url) {
				await router.navigateByUrl(url);
			}

			sessionEnded.next('expired');

			await vi.waitFor(() =>
				expect(notify).toHaveBeenCalledWith('expired', protectedPage)
			);
		}
	);

	it("goes to the login page, to return after, when the notice can't load on a protected page", async () => {
		const router = start();
		await router.navigateByUrl('/admin#news');
		notify.mockImplementation(() => {
			throw new Error('Failed to fetch dynamically imported module');
		});

		sessionEnded.next('expired');

		await vi.waitFor(() => expect(router.url).toBe('/admin/login'));
		expect(sessionStorage.getItem(STORAGE_KEYS.loginReturnUrl)).toBe(
			'/admin#news'
		);
	});

	it('does nothing on the server', async () => {
		await start('server').navigateByUrl('/news');

		expect(sessionEnded.observed).toBe(false);
	});
});
