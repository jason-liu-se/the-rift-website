import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { catchError, of } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';

/**
 * The logged-in editor's avatar and username. Falls back to their initial when
 * they have no avatar (or it fails to load), and to a generic icon while the
 * user loads or if the request fails.
 */
@Component({
	selector: 'app-admin-user',
	templateUrl: './admin-user.component.html',
	styleUrls: ['./admin-user.component.scss'],
	imports: [MatIcon]
})
export class AdminUserComponent {
	public readonly user = toSignal(
		inject(AuthService)
			.getMe()
			.pipe(catchError(() => of(null))),
		{ initialValue: null }
	);

	public readonly avatarFailed = signal(false);
	public readonly avatarUrl = computed(() =>
		this.avatarFailed() ? undefined : this.user()?.avatarUrl
	);
	public readonly initial = computed(() =>
		this.user()?.username.charAt(0).toUpperCase()
	);
}
