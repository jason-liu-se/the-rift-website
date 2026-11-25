import { Component, computed, input } from '@angular/core';
import { DownloadCardComponent } from 'src/app/components/download-card/download-card.component';
import { DraftSession } from '../../../drafts/draft-session';

/** A download's draft as the downloads page shows it. */
@Component({
	selector: 'app-downloads-preview',
	template: `<app-download-card
		[title]="fields().title || 'Untitled'"
		[desc]="fields().desc ?? ''"
		[src]="fields().downloadUrl ?? ''"
		[imgSrc]="fields().imageUrl ?? ''"
	/>`,
	styles: `
		app-download-card {
			display: block;
			max-width: 24rem;
			margin: 0 auto;
		}
	`,
	imports: [DownloadCardComponent]
})
export class DownloadsPreviewComponent {
	public readonly session = input.required<DraftSession<'downloads'>>();

	protected readonly fields = computed(() => this.session().fields());
}
