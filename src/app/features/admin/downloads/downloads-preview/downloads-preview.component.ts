import { Component, computed, input } from '@angular/core';
import { DownloadCardComponent } from 'src/app/features/downloads/download-card/download-card.component';
import { DraftSession } from '../../drafts/draft-session';

/** A download's draft as the downloads page shows it. */
@Component({
	selector: 'app-downloads-preview',
	templateUrl: './downloads-preview.component.html',
	styleUrl: './downloads-preview.component.scss',
	imports: [DownloadCardComponent]
})
export class DownloadsPreviewComponent {
	public readonly session = input.required<DraftSession<'downloads'>>();

	protected readonly fields = computed(() => this.session().fields());
}
