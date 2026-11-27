import { Component, computed, input } from '@angular/core';
import { CaptionCardComponent } from 'src/app/shared/ui/caption-card/caption-card.component';
import { DraftSession } from '../../../drafts/draft-session';

/** A gallery image's draft as the gallery shows it. */
@Component({
	selector: 'app-gallery-preview',
	templateUrl: './gallery-preview.component.html',
	styleUrl: './gallery-preview.component.scss',
	imports: [CaptionCardComponent]
})
export class GalleryPreviewComponent {
	public readonly session = input.required<DraftSession<'gallery'>>();

	protected readonly fields = computed(() => this.session().fields());
}
