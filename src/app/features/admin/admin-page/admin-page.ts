import { DOCUMENT, IMAGE_LOADER } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { EDITOR_TYPES, EDITOR_TYPE_ORDER } from '../editor-types';
import { AdminBar } from '../admin-bar/admin-bar';
import { DraftStore } from '../drafts/draft-store.service';
import { CollectionsStore } from '../collections-store.service';
import { originalImageLoader } from 'src/app/shared/utils/image-loaders';

/** The tools, in sidebar order; each at /admin/<type>. */
export const ADMIN_TOOLS = EDITOR_TYPE_ORDER.map((id) => ({
	id,
	label: EDITOR_TYPES[id].label,
	icon: EDITOR_TYPES[id].icon
}));

/**
 * The admin shell: its app bar, and the tools' sidebar (a bottom tab bar on
 * mobile) beside the open tool (a child route).
 */
@Component({
	selector: 'app-admin-page',
	templateUrl: './admin-page.html',
	styleUrls: ['./admin-page.scss'],
	imports: [AdminBar, MatIcon, RouterLink, RouterLinkActive, RouterOutlet],
	// Previews show whatever URL an editor types: don't spend Cloudflare
	// transformations on them.
	providers: [
		CollectionsStore,
		{ provide: IMAGE_LOADER, useValue: originalImageLoader },
		// Outlined, not filled: a focused label on the fill's grey is under
		// 4.5:1 contrast.
		{
			provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
			useValue: { appearance: 'outline' }
		}
	]
})
export class AdminPage {
	protected readonly tools = ADMIN_TOOLS;

	constructor() {
		loadAdminTheme(inject(DOCUMENT));
		// Sends changes to drafts kept only in this browser.
		inject(DraftStore).sync();
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
