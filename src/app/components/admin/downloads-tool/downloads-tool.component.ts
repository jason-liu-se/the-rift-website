import { Component } from '@angular/core';
import { DownloadItem } from 'src/app/interfaces/api-responses';
import { DownloadCardComponent } from '../../download-card/download-card.component';

/** Placeholder: will create downloads. The preview shows sample data. */
@Component({
	selector: 'app-downloads-tool',
	templateUrl: './downloads-tool.component.html',
	imports: [DownloadCardComponent]
})
export class DownloadsToolComponent {
	public readonly preview: DownloadItem = {
		id: 'preview',
		title: 'Sample download',
		desc: 'A description of the download will appear here.',
		downloadUrl: 'https://example.com/world.zip',
		backgroundUrl: '/assets/general-background-images/iron-farm-1.webp'
	};
}
