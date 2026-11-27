import { Component, computed, input } from '@angular/core';
import { DownloadCard } from 'src/app/features/downloads/download-card/download-card';
import { DraftSession } from '../../drafts/draft-session';

/** A download's draft as the downloads page shows it. */
@Component({
	selector: 'app-downloads-preview',
	templateUrl: './downloads-preview.html',
	styleUrl: './downloads-preview.scss',
	imports: [DownloadCard]
})
export class DownloadsPreview {
	public readonly session = input.required<DraftSession<'downloads'>>();

	protected readonly fields = computed(() => this.session().fields());
}
