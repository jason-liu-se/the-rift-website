import { Component, input } from '@angular/core';
import { EditorRef } from 'src/app/core/api/api-responses';
import { untilLoadFails } from 'src/app/shared/utils/image-load-failure';

/**
 * Who made an edit, as a picture beside their name: their Discord avatar, or
 * a plain circle when there's none, it no longer loads (as after they change
 * it), or the item is older than the edit history.
 */
@Component({
	selector: 'app-editor-avatar',
	templateUrl: './editor-avatar.html',
	styleUrl: './editor-avatar.scss'
})
export class EditorAvatar {
	public readonly editor = input<Pick<EditorRef, 'username' | 'avatarUrl'>>();

	protected readonly avatar = untilLoadFails(() => this.editor()?.avatarUrl);
}
