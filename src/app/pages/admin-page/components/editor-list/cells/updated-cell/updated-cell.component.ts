import { Component, computed, input } from '@angular/core';
import { EditorRef } from 'src/app/core/api/api-responses';
import { formatRelativeTime } from 'src/app/utilities/relative-time';
import { formatDateTime } from '../../../../utilities/format-date-time';
import { EditorAvatarComponent } from '../../../editor-avatar/editor-avatar.component';

/** Who last changed a row, and how long ago (the date and time on hover). */
@Component({
	selector: 'app-updated-cell',
	templateUrl: './updated-cell.component.html',
	styleUrl: './updated-cell.component.scss',
	imports: [EditorAvatarComponent]
})
export class UpdatedCellComponent {
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
