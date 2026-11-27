import {
	Component,
	TemplateRef,
	inject,
	signal,
	viewChild
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
	MatDialog,
	MatDialogActions,
	MatDialogClose,
	MatDialogContent,
	MatDialogRef,
	MatDialogTitle
} from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { BULK_ACTION_HOST } from '../../editor-list/bulk-action-host';
import { MoveBulkAction } from '../../move-bulk-action/move-bulk-action';
import { TagInput } from '../../tag-input/tag-input';

/** The gallery's own bulk actions: move to a collection, add or remove tags. */
@Component({
	selector: 'app-gallery-bulk-actions',
	templateUrl: './gallery-bulk-actions.html',
	styles: ':host { display: contents; }',
	imports: [
		MatButton,
		MatDialogActions,
		MatDialogClose,
		MatDialogContent,
		MatDialogTitle,
		MatIcon,
		MoveBulkAction,
		TagInput
	]
})
export class GalleryBulkActions {
	private host = inject(BULK_ACTION_HOST);
	private dialog = inject(MatDialog);
	private tagsDialog = viewChild.required<TemplateRef<unknown>>('tagsDialog');
	private dialogRef?: MatDialogRef<unknown>;

	protected readonly tags = signal<string[]>([]);

	protected openTags(): void {
		this.tags.set([]);
		this.dialogRef = this.dialog.open(this.tagsDialog(), {
			width: 'min(28rem, 92vw)'
		});
	}

	protected changeTags(action: 'add-tags' | 'remove-tags'): void {
		this.host.runBulkAction({ action, tags: this.tags() });
		this.dialogRef?.close();
	}
}
