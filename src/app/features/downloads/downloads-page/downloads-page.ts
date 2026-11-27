import { DownloadsApi } from 'src/app/features/downloads/downloads-api';
import { BackgroundImageCard } from '../../../shared/ui/background-image-card/background-image-card';
import { Component, inject } from '@angular/core';
import { DownloadCollection } from 'src/app/core/api/api-responses';
import { SectionCard } from '../../../shared/ui/section-card/section-card';
import { DownloadCard } from '../download-card/download-card';
import { FallbackPanel } from '../../../shared/ui/fallback-panel/fallback-panel';
import { LoadState } from '../../../shared/utils/load-state';

@Component({
	selector: 'app-downloads-page',
	templateUrl: './downloads-page.html',
	styleUrls: ['./downloads-page.scss'],
	imports: [BackgroundImageCard, SectionCard, DownloadCard, FallbackPanel]
})
export class DownloadsPage {
	private downloadsApi = inject(DownloadsApi);

	public downloadCollections: DownloadCollection[] = [];
	protected readonly loadState = new LoadState(() =>
		this.loadDownloadCollections()
	);

	constructor() {
		this.loadDownloadCollections();
	}

	public loadDownloadCollections(): void {
		this.loadState.start();
		this.downloadsApi.getDownloadCollections().subscribe({
			next: (collections) => {
				this.downloadCollections = collections;
				this.loadState.succeed();
			},
			error: () => this.loadState.fail()
		});
	}
}
