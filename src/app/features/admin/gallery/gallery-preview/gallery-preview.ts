import { Component, computed, input } from '@angular/core';
import { CaptionCard } from 'src/app/shared/ui/caption-card/caption-card';
import { DraftSession } from '../../drafts/draft-session';

/** A gallery image's draft as the gallery shows it. */
@Component({
	selector: 'app-gallery-preview',
	templateUrl: './gallery-preview.html',
	styleUrl: './gallery-preview.scss',
	imports: [CaptionCard]
})
export class GalleryPreview {
	public readonly session = input.required<DraftSession<'gallery'>>();

	protected readonly fields = computed(() => this.session().fields());
}
