import { DOCUMENT, IMAGE_LOADER } from '@angular/common';
import {
	Component,
	ElementRef,
	Injector,
	afterNextRender,
	computed,
	effect,
	inject,
	viewChild
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DownloadsToolComponent } from './components/downloads-tool/downloads-tool.component';
import { GalleryToolComponent } from './components/gallery-tool/gallery-tool.component';
import { NewsToolComponent } from './components/news-tool/news-tool.component';
import { SITE_NAME } from 'src/app/config/site';
import { originalImageLoader } from 'src/app/utilities/image-loaders';

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
		MatIcon,
		RouterLink,
		NewsToolComponent,
		DownloadsToolComponent,
		GalleryToolComponent
	],
	// Previews show whatever URL an editor types: don't spend Cloudflare
	// transformations on them.
	providers: [
		{ provide: IMAGE_LOADER, useValue: originalImageLoader },
		// Outlined, not filled: a focused label on the fill's grey is under
		// 4.5:1 contrast.
		{
			provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
			useValue: { appearance: 'outline' }
		}
	]
})
export class AdminPageComponent {
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

	constructor() {
		loadAdminTheme(inject(DOCUMENT));
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
}

/** The admin theme's stylesheet (angular.json builds it, not injected). */
export const ADMIN_THEME_HREF = 'admin-theme.css';

/**
 * Adds the Material themes only the admin tools use (src/admin-theme.scss),
 * once, so the public pages never download them.
 */
function loadAdminTheme(document: Document): void {
	if (document.getElementById('admin-theme')) {
		return;
	}
	const link = document.createElement('link');
	link.id = 'admin-theme';
	link.rel = 'stylesheet';
	link.href = ADMIN_THEME_HREF;
	document.head.append(link);
}
