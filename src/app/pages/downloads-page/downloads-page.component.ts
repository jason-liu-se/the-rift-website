import { DownloadsProviderService } from './../../services/downloads-provider.service';
import { BackgroundImageCardComponent } from './../../components/background-image-card/background-image-card.component';
import { Component, inject } from '@angular/core';
import { DownloadCollection } from 'src/app/interfaces/api-responses';
import { SectionCardComponent } from '../../components/section-card/section-card.component';
import { DownloadCardComponent } from '../../components/download-card/download-card.component';

@Component({
	selector: 'app-downloads-page',
	templateUrl: './downloads-page.component.html',
	styleUrls: ['./downloads-page.component.scss'],
	imports: [
		BackgroundImageCardComponent,
		SectionCardComponent,
		DownloadCardComponent
	]
})
export class DownloadsPageComponent {
	private downloadsProvider = inject(DownloadsProviderService);

	public downloadCollections!: DownloadCollection[];

	constructor() {
		this.downloadsProvider
			.getDownloadCollections()
			.subscribe(
				(data: DownloadCollection[]) =>
					(this.downloadCollections = data)
			);
	}
}
