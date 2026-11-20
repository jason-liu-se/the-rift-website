import { Component, computed, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { AuthService } from 'src/app/services/auth/auth.service';

/**
 * The logged-in editor's avatar and username. Falls back to their initial when
 * they have no avatar (or it fails to load), and to a generic icon when nobody
 * is logged in.
 */
@Component({
	selector: 'app-admin-user',
	templateUrl: './admin-user.component.html',
	styleUrls: ['./admin-user.component.scss'],
	imports: [MatIcon]
})
export class AdminUserComponent {
	public readonly user = inject(AuthService).user;

	public readonly avatarFailed = signal(false);
	public readonly avatarUrl = computed(() =>
		this.avatarFailed() ? undefined : this.user()?.avatarUrl
	);
	public readonly initial = computed(() =>
		this.user()?.username.charAt(0).toUpperCase()
	);
}
