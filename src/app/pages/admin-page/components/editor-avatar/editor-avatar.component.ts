import { Component, computed, input, signal } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { EditorRef } from 'src/app/interfaces/api-responses';

/**
 * Who made an edit: their Discord avatar, with their name as its alt text and
 * in a tooltip on hover or keyboard focus (so it's never hover-only). Their name instead when there's no avatar (or it no longer
 * loads, as after they change it), and "unknown" for items older than the
 * edit history.
 */
@Component({
	selector: 'app-editor-avatar',
	templateUrl: './editor-avatar.component.html',
	styleUrl: './editor-avatar.component.scss',
	imports: [MatTooltip]
})
export class EditorAvatarComponent {
	public readonly editor = input<Pick<EditorRef, 'username' | 'avatarUrl'>>();

	private readonly failedUrl = signal<string | undefined>(undefined);
	protected readonly avatarUrl = computed(() => {
		const url = this.editor()?.avatarUrl;
		return url !== this.failedUrl() ? url : undefined;
	});

	protected markFailed(url: string): void {
		this.failedUrl.set(url);
	}
}
