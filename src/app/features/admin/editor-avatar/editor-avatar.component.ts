import { Component, computed, input, signal } from '@angular/core';
import { EditorRef } from 'src/app/core/api/api-responses';

/**
 * Who made an edit, as a picture beside their name: their Discord avatar, or
 * a plain circle when there's none, it no longer loads (as after they change
 * it), or the item is older than the edit history.
 */
@Component({
	selector: 'app-editor-avatar',
	templateUrl: './editor-avatar.component.html',
	styleUrl: './editor-avatar.component.scss'
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
