import { Component, computed, inject, input, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { AuthService } from 'src/app/core/auth/auth.service';

/**
 * The logged-in editor's avatar and username. Falls back to their initial when
 * they have no avatar (or it fails to load), and to a generic icon when nobody
 * is logged in.
 */
@Component({
	selector: 'app-user-avatar',
	templateUrl: './user-avatar.component.html',
	styleUrls: ['./user-avatar.component.scss'],
	imports: [MatIcon]
})
export class UserAvatarComponent {
	public readonly user = inject(AuthService).user;
	/** Turn off to show the avatar alone. */
	public readonly showUsername = input(true);

	public readonly avatarFailed = signal(false);
	public readonly avatarUrl = computed(() =>
		this.avatarFailed() ? undefined : this.user()?.avatarUrl
	);
	public readonly initial = computed(() =>
		this.user()?.username.charAt(0).toUpperCase()
	);
}
