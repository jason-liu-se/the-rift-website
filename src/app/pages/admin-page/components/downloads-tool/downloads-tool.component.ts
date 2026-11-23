import { Component } from '@angular/core';
import { EditorListComponent } from '../editor-list/editor-list.component';
import { FilterOption } from '../editor-list/list-filters/list-filters.component';
import { DownloadItem } from 'src/app/interfaces/api-responses';
import { DownloadCardComponent } from '../../../../components/download-card/download-card.component';

/** Placeholder: will create downloads. The preview shows sample data. */
@Component({
	selector: 'app-downloads-tool',
	templateUrl: './downloads-tool.component.html',
	styleUrls: ['../admin-tool.scss'],
	imports: [EditorListComponent, DownloadCardComponent]
})
export class DownloadsToolComponent {
	protected readonly noun = { one: 'download', many: 'downloads' };
	protected readonly searchFields: FilterOption[] = [
		{ value: 'title', label: 'Title' },
		{ value: 'desc', label: 'Description' }
	];

	public readonly preview: DownloadItem = {
		id: 'preview',
		title: 'Sample download',
		desc: 'A description of the download will appear here.',
		downloadUrl: 'https://example.com/world.zip',
		imageUrl: '/assets/general-background-images/iron-farm-1.webp'
	};
}
