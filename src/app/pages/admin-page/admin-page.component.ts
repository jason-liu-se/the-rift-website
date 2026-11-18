import { ErrorCardComponent } from 'src/app/components/error-card/error-card.component';
import {
	Component,
	ElementRef,
	Injector,
	afterNextRender,
	computed,
	effect,
	inject,
	signal,
	viewChild
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminUserComponent } from './components/admin-user/admin-user.component';
import { DownloadsToolComponent } from './components/downloads-tool/downloads-tool.component';
import { GalleryToolComponent } from './components/gallery-tool/gallery-tool.component';
import { NewsToolComponent } from './components/news-tool/news-tool.component';
import { ADMIN_LOGIN_PATH } from 'src/app/config/admin';
import { SITE_NAME } from 'src/app/config/site';
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
		ErrorCardComponent,
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
	private title = inject(Title);
	private injector = inject(Injector);
	private fragment = toSignal(inject(ActivatedRoute).fragment);
	private toolTitle =
		viewChild.required<ElementRef<HTMLElement>>('toolTitle');

	public readonly tools = ADMIN_TOOLS;
	/** An unknown or missing fragment opens the first tool. */
	public readonly activeTool = computed(
		() =>
			this.tools.find((tool) => tool.id === this.fragment()) ??
			this.tools[0]
	);

	public readonly loggingOut = signal(false);
	public readonly logoutFailed = signal(false);

	constructor() {
		let isFirstTool = true;
		// Switching tools only changes the fragment, so say so: retitle the
		// document, and move focus to the new heading (not on first load, when
		// PageTemplateComponent handles focus).
		effect(() => {
			const tool = this.activeTool();
			this.title.setTitle(`${tool.label} · Admin | ${SITE_NAME}`);
			if (isFirstTool) {
				isFirstTool = false;
				return;
			}
			afterNextRender(() => this.toolTitle().nativeElement.focus(), {
				injector: this.injector
			});
		});
	}

	public logout(): void {
		if (this.loggingOut()) {
			return;
		}
		this.loggingOut.set(true);
		this.logoutFailed.set(false);
		this.auth.logout().subscribe({
			complete: () => this.router.navigateByUrl(ADMIN_LOGIN_PATH),
			// Still logged in: the login page would send the editor straight back.
			error: () => {
				this.loggingOut.set(false);
				this.logoutFailed.set(true);
			}
		});
	}
}
