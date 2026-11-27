import { Component, computed, input } from '@angular/core';
import { EditorRef } from 'src/app/core/api/api-responses';
import { formatRelativeTime } from 'src/app/features/admin/relative-time';
import { formatDateTime } from '../../../format-date-time';
import { EditorAvatar } from '../../../editor-avatar/editor-avatar';

/** Who last changed a row, and how long ago (the date and time on hover). */
@Component({
	selector: 'app-updated-cell',
	templateUrl: './updated-cell.html',
	styleUrl: './updated-cell.scss',
	imports: [EditorAvatar]
})
export class UpdatedCell {
	public readonly editor = input<Pick<EditorRef, 'username' | 'avatarUrl'>>();
	/** ISO 8601; items older than the edit history have none. */
	public readonly updatedAt = input<string>();

	protected readonly updatedAgo = computed(() => {
		const updatedAt = this.updatedAt();
		return updatedAt ? formatRelativeTime(updatedAt) : '';
	});
	protected readonly updatedAtText = computed(() => {
		const updatedAt = this.updatedAt();
		return updatedAt ? formatDateTime(updatedAt) : '';
	});
}
