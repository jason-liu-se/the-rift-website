import { Component } from '@angular/core';
import { ContentToolComponent } from '../content-tool/content-tool.component';
import { FilterOption } from '../editor-list/list-filters/list-filters.component';
import { MoveBulkActionComponent } from '../move-bulk-action/move-bulk-action.component';
import { DownloadsFormComponent } from './downloads-form/downloads-form.component';

/**
 * Creates, edits, moves, and deletes downloads. The list is in the downloads
 * page's order: sort order, then title.
 */
@Component({
	selector: 'app-downloads-tool',
	templateUrl: './downloads-tool.component.html',
	styleUrl: './downloads-tool.component.scss',
	imports: [
		ContentToolComponent,
		DownloadsFormComponent,
		MoveBulkActionComponent
	]
})
export class DownloadsToolComponent {
	protected readonly noun = { one: 'download', many: 'downloads' };
	protected readonly searchFields: FilterOption[] = [
		{ value: 'title', label: 'Title' },
		{ value: 'desc', label: 'Description' }
	];
}
