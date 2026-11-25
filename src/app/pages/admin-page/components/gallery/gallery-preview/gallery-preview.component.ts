import { Component, computed, input } from '@angular/core';
import { CaptionCardComponent } from 'src/app/components/caption-card/caption-card.component';
import { DraftSession } from '../../../drafts/draft-session';

/** A gallery image's draft as the gallery shows it. */
@Component({
	selector: 'app-gallery-preview',
	template: `@if (fields().imageUrl; as imageUrl) {
			<app-caption-card
				[src]="imageUrl"
				[caption]="fields().caption ?? ''"
			/>
		} @else {
			<p class="empty">The image shows here once it's added.</p>
		}`,
	styles: `
		app-caption-card {
			display: block;
			max-width: 28rem;
			margin: 0 auto;
		}

		.empty {
			margin: 0;
			padding: 48px 16px;
			text-align: center;
		}
	`,
	imports: [CaptionCardComponent]
})
export class GalleryPreviewComponent {
	public readonly session = input.required<DraftSession<'gallery'>>();

	protected readonly fields = computed(() => this.session().fields());
}
