import { DownloadsProviderService } from 'src/app/services/downloads-provider/downloads-provider.service';
import { BackgroundImageCardComponent } from '../../shared/ui/background-image-card/background-image-card.component';
import { Component, inject } from '@angular/core';
import { DownloadCollection } from 'src/app/core/api/api-responses';
import { SectionCardComponent } from '../../shared/ui/section-card/section-card.component';
import { DownloadCardComponent } from '../../components/download-card/download-card.component';
import { FallbackPanelComponent } from '../../shared/ui/fallback-panel/fallback-panel.component';
import { LoadState } from '../../shared/utils/load-state';

@Component({
	selector: 'app-downloads-page',
	templateUrl: './downloads-page.component.html',
	styleUrls: ['./downloads-page.component.scss'],
	imports: [
		BackgroundImageCardComponent,
		SectionCardComponent,
		DownloadCardComponent,
		FallbackPanelComponent
	]
})
export class DownloadsPageComponent {
	private downloadsProvider = inject(DownloadsProviderService);

	public downloadCollections: DownloadCollection[] = [];
	protected readonly loadState = new LoadState(() =>
		this.loadDownloadCollections()
	);

	constructor() {
		this.loadDownloadCollections();
	}

	public loadDownloadCollections(): void {
		this.loadState.start();
		this.downloadsProvider.getDownloadCollections().subscribe({
			next: (collections) => {
				this.downloadCollections = collections;
				this.loadState.succeed();
			},
			error: () => this.loadState.fail()
		});
	}
}
