import { Component, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute } from '@angular/router';
import { LoginErrorCode } from 'src/app/interfaces/api-responses';
import { AuthService } from 'src/app/services/auth/auth.service';
import { FeedbackCardComponent } from 'src/app/components/feedback-card/feedback-card.component';

const LOGIN_ERROR_MESSAGES: Record<LoginErrorCode, string> = {
	'access-denied': 'Login was cancelled on Discord.',
	'invalid-request': 'That login attempt expired or was invalid. Try again.',
	'not-authorized': "Your Discord account doesn't have admin access.",
	'rate-limited': 'Too many login attempts. Try again in a minute.',
	'discord-unavailable': "Discord isn't responding. Try again later.",
	'server-error': 'Something went wrong on our end. Try again later.'
};

const UNKNOWN_ERROR_MESSAGE = 'Login failed. Try again.';

/**
 * Starts a Discord login, and explains why the last one failed (`?error=`). A
 * logout the API hasn't heard of yet goes first, or its old cookies would stay
 * if the Discord login is abandoned.
 */
@Component({
	selector: 'app-admin-login-page',
	templateUrl: './admin-login-page.component.html',
	styleUrls: ['./admin-login-page.component.scss'],
	imports: [FeedbackCardComponent, MatButton]
})
export class AdminLoginPageComponent {
	private auth = inject(AuthService);

	public readonly loginUrl = this.auth.loginUrl;
	/** The pending logout couldn't be sent: the API is unreachable. */
	public readonly apiUnreachable = signal(false);
	public readonly errorMessage = loginErrorMessage(
		inject(ActivatedRoute).snapshot.queryParamMap.get('error')
	);

	public startLogin(event: Event): void {
		if (!this.auth.isLogoutPending()) {
			return;
		}
		event.preventDefault();
		const link = event.currentTarget as HTMLElement;
		this.apiUnreachable.set(false);
		this.auth.finishLogout().subscribe((done) => {
			if (done) {
				// Nothing is pending now, so the link goes to Discord.
				link.click();
			} else {
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
