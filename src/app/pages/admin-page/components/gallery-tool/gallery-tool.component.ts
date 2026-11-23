import { Component } from '@angular/core';
import { GalleryImage } from 'src/app/interfaces/api-responses';
import { CaptionCardComponent } from '../../../../components/caption-card/caption-card.component';

/** Placeholder: will add gallery images. The preview shows sample data. */
@Component({
	selector: 'app-gallery-tool',
	templateUrl: './gallery-tool.component.html',
	styleUrls: ['../admin-tool.scss', './gallery-tool.component.scss'],
	imports: [CaptionCardComponent]
})
export class GalleryToolComponent {
	public readonly preview: GalleryImage = {
		id: 'preview',
		imageUrl: '/assets/general-background-images/fancy-tree-1.webp',
		caption: 'Sample caption',
		tags: []
	};
}
