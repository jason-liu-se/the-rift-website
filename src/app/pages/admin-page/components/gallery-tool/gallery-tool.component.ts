import { Component, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { ContentToolComponent } from '../content-tool/content-tool.component';
import { FilterOption } from '../editor-list/list-filters/list-filters.component';
import { GalleryBulkActionsComponent } from './gallery-bulk-actions/gallery-bulk-actions.component';
import { GalleryBulkCreateComponent } from './gallery-bulk-create/gallery-bulk-create.component';
import { GalleryFormComponent } from './gallery-form/gallery-form.component';

/** Adds (one or many), edits, tags, moves, and deletes gallery images. */
@Component({
	selector: 'app-gallery-tool',
	templateUrl: './gallery-tool.component.html',
	styleUrl: './gallery-tool.component.scss',
	imports: [
		ContentToolComponent,
		GalleryBulkActionsComponent,
		GalleryBulkCreateComponent,
		GalleryFormComponent,
		MatButton
	]
})
export class GalleryToolComponent {
	protected readonly noun = { one: 'image', many: 'images' };
	protected readonly searchFields: FilterOption[] = [
		{ value: 'caption', label: 'Caption' },
		{ value: 'tags', label: 'Tags' }
	];
	protected readonly isBulkCreating = signal(false);
}
