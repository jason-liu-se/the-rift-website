import { Component, InjectionToken, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute } from '@angular/router';
import { LoginErrorCode } from 'src/app/core/api/api-responses';
import { AuthService } from 'src/app/core/auth/auth.service';
import { FeedbackCardComponent } from 'src/app/shared/ui/feedback-card/feedback-card.component';

const LOGIN_ERROR_MESSAGES: Record<LoginErrorCode, string> = {
	'access-denied': 'Login was cancelled on Discord.',
	'invalid-request': 'That login attempt expired or was invalid. Try again.',
	'not-authorized': "Your Discord account doesn't have admin access.",
	'rate-limited': 'Too many login attempts. Try again in a minute.',
	'discord-unavailable': "Discord isn't responding. Try again later.",
	'server-error': 'Something went wrong on our end. Try again later.'
};

const UNKNOWN_ERROR_MESSAGE = 'Login failed. Try again.';

/** Sends the browser to a URL; a token so tests can observe it. */
export const NAVIGATE_TO = new InjectionToken<(url: string) => void>(
	'NAVIGATE_TO',
	{ factory: () => (url) => window.location.assign(url) }
);

/**
 * Starts a Discord login, and explains why the last one failed (`?error=`). A
 * logout the API hasn't heard of yet goes first, or its old cookies would stay
 * if the Discord login is abandoned. The control is a button, not a link, so
 * no way of opening it skips that.
 */
@Component({
	selector: 'app-admin-login-page',
	templateUrl: './admin-login-page.component.html',
	styleUrls: ['./admin-login-page.component.scss'],
	imports: [FeedbackCardComponent, MatButton]
})
export class AdminLoginPageComponent {
	private auth = inject(AuthService);
	private navigateTo = inject(NAVIGATE_TO);

	public readonly errorMessage = loginErrorMessage(
		inject(ActivatedRoute).snapshot.queryParamMap.get('error')
	);
	/** The pending logout is being sent before the login starts. */
	public readonly starting = signal(false);
	/** The pending logout couldn't be sent: the API is unreachable. */
	public readonly apiUnreachable = signal(false);

	public startLogin(): void {
		if (this.starting()) {
			return;
		}
		if (!this.auth.isLogoutPending()) {
			this.navigateTo(this.auth.loginUrl);
			return;
		}
		this.starting.set(true);
		this.apiUnreachable.set(false);
		this.auth.finishLogout().subscribe((done) => {
			if (done) {
				this.navigateTo(this.auth.loginUrl);
			} else {
				this.starting.set(false);
				this.apiUnreachable.set(true);
			}
		});
	}
}

function loginErrorMessage(code: string | null): string | null {
	if (code === null) {
		return null;
	}
	return Object.hasOwn(LOGIN_ERROR_MESSAGES, code)
		? LOGIN_ERROR_MESSAGES[code as LoginErrorCode]
		: UNKNOWN_ERROR_MESSAGE;
}
