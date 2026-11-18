import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminUserComponent } from './components/admin-user/admin-user.component';
import { DownloadsToolComponent } from './components/downloads-tool/downloads-tool.component';
import { GalleryToolComponent } from './components/gallery-tool/gallery-tool.component';
import { NewsToolComponent } from './components/news-tool/news-tool.component';
import { ADMIN_LOGIN_PATH } from 'src/app/config/admin';
import { AuthService } from 'src/app/services/auth.service';

interface IAdminTool {
	/** The URL fragment that opens the tool, e.g. /admin#news. */
	id: string;
	label: string;
	icon: string;
}

export const ADMIN_TOOLS: readonly IAdminTool[] = [
	{ id: 'news', label: 'News', icon: 'newspaper' },
	{ id: 'downloads', label: 'Downloads', icon: 'download' },
	{ id: 'gallery', label: 'Gallery', icon: 'photo_library' }
];

/**
 * A dashboard of tools for creating site content, one at a time, picked by URL
 * fragment from the sidebar (a tab bar on mobile).
 */
@Component({
	selector: 'app-admin-page',
	templateUrl: './admin-page.component.html',
	styleUrls: ['./admin-page.component.scss'],
	imports: [
		MatButton,
		MatIcon,
		RouterLink,
		AdminUserComponent,
		NewsToolComponent,
		DownloadsToolComponent,
		GalleryToolComponent
	]
})
export class AdminPageComponent {
	private auth = inject(AuthService);
	private router = inject(Router);
	private fragment = toSignal(inject(ActivatedRoute).fragment);

	public readonly tools = ADMIN_TOOLS;
	/** An unknown or missing fragment opens the first tool. */
	public readonly activeTool = computed(
		() =>
			this.tools.find((tool) => tool.id === this.fragment()) ??
			this.tools[0]
	);
	public readonly activeToolId = computed(() => this.activeTool().id);

	public readonly logoutFailed = signal(false);

	public logout(): void {
		this.logoutFailed.set(false);
		this.auth.logout().subscribe({
			complete: () => this.router.navigateByUrl(ADMIN_LOGIN_PATH),
			// Still logged in: the login page would send the editor straight back.
			error: () => this.logoutFailed.set(true)
		});
	}
}
