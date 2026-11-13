import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DownloadsToolComponent } from 'src/app/components/admin/downloads-tool/downloads-tool.component';
import { GalleryToolComponent } from 'src/app/components/admin/gallery-tool/gallery-tool.component';
import { NewsToolComponent } from 'src/app/components/admin/news-tool/news-tool.component';
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

/** Tools for creating site content, one at a time, picked by URL fragment. */
@Component({
	selector: 'app-admin-page',
	templateUrl: './admin-page.component.html',
	styleUrls: ['./admin-page.component.scss'],
	imports: [
		MatButton,
		MatIcon,
		MatTabNav,
		MatTabLink,
		MatTabNavPanel,
		RouterLink,
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
	public readonly activeToolId = computed(
		() =>
			this.tools.find((tool) => tool.id === this.fragment())?.id ??
			this.tools[0].id
	);

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
