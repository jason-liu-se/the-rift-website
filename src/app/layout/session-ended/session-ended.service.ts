import { isPlatformBrowser } from '@angular/common';
import {
	DestroyRef,
	Injectable,
	Injector,
	PLATFORM_ID,
	inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ADMIN_LOGIN_PATH } from 'src/app/config/admin';
import { saveLoginReturnUrl } from 'src/app/guards/login-return-url';
import { BrowserStorage } from 'src/app/services/browser-storage/browser-storage.service';
import { isOnProtectedPage } from 'src/app/guards/requires-login';
import {
	AuthService,
	SessionEndReason
} from 'src/app/services/auth/auth.service';

/**
 * Tells the user when their session ends without a logout in this tab, through
 * `SessionEndedNotifier` (loaded on first use). On a fresh load of a protected
 * page no page is open yet, so it's the toast, and `requireLoggedIn` then
 * redirects to the login page.
 */
@Injectable({
	providedIn: 'root'
})
export class SessionEndedService {
	private auth = inject(AuthService);
	private router = inject(Router);
	private storage = inject(BrowserStorage);
	private injector = inject(Injector);
	private destroyRef = inject(DestroyRef);
	private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

	public start(): void {
		if (!this.isBrowser) {
			return;
		}
		this.auth.sessionEnded
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe((reason) => this.notify(reason));
	}

	private notify(reason: SessionEndReason): void {
		const onProtectedPage = isOnProtectedPage(this.router);
		import('./session-ended-notifier')
			.then(({ SessionEndedNotifier }) =>
				this.injector
					.get(SessionEndedNotifier)
					.notify(reason, onProtectedPage)
			)
			.catch(() => {
				// Its code is gone (a deploy replaced it). A protected page no
				// longer works: log in again as the dialog would, returning here.
				if (onProtectedPage) {
					saveLoginReturnUrl(this.storage, this.router.url);
					void this.router.navigateByUrl(ADMIN_LOGIN_PATH);
				}
			});
	}
}
