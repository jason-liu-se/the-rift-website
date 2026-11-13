import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute } from '@angular/router';
import { LoginErrorCode } from 'src/app/interfaces/api-responses';
import { AuthService } from 'src/app/services/auth.service';

const LOGIN_ERROR_MESSAGES: Record<LoginErrorCode, string> = {
	'access-denied': 'Login was cancelled on Discord.',
	'invalid-request': 'That login attempt expired or was invalid. Try again.',
	'not-authorized': "Your Discord account doesn't have admin access.",
	'rate-limited': 'Too many login attempts. Try again in a minute.',
	'discord-unavailable': "Discord isn't responding. Try again later.",
	'server-error': 'Something went wrong on our end. Try again later.'
};

const UNKNOWN_ERROR_MESSAGE = 'Login failed. Try again.';

/** Starts a Discord login, and explains why the last one failed (`?error=`). */
@Component({
	selector: 'app-admin-login-page',
	templateUrl: './admin-login-page.component.html',
	styleUrls: ['./admin-login-page.component.scss'],
	imports: [MatButton]
})
export class AdminLoginPageComponent {
	public readonly loginUrl = inject(AuthService).loginUrl;
	public readonly errorMessage = loginErrorMessage(
		inject(ActivatedRoute).snapshot.queryParamMap.get('error')
	);
}

function loginErrorMessage(code: string | null): string | null {
	if (code === null) {
		return null;
	}
	return Object.hasOwn(LOGIN_ERROR_MESSAGES, code)
		? LOGIN_ERROR_MESSAGES[code as LoginErrorCode]
		: UNKNOWN_ERROR_MESSAGE;
}
