import { Component } from '@angular/core';
import { CollectionsManagerComponent } from '../collections-manager/collections-manager.component';
import { EditorListComponent } from '../editor-list/editor-list.component';
import { FilterOption } from '../editor-list/list-filters/list-filters.component';
import { GalleryImage } from 'src/app/interfaces/api-responses';
import { CaptionCardComponent } from '../../../../components/caption-card/caption-card.component';

/** Placeholder: will add gallery images. The preview shows sample data. */
@Component({
	selector: 'app-gallery-tool',
	templateUrl: './gallery-tool.component.html',
	styleUrls: ['../admin-tool.scss', './gallery-tool.component.scss'],
	imports: [
		CollectionsManagerComponent,
		EditorListComponent,
		CaptionCardComponent
	]
})
export class GalleryToolComponent {
	protected readonly noun = { one: 'image', many: 'images' };
	protected readonly searchFields: FilterOption[] = [
		{ value: 'caption', label: 'Caption' },
		{ value: 'tags', label: 'Tags' }
	];

	public readonly preview: GalleryImage = {
		id: 'preview',
		imageUrl: '/assets/general-background-images/fancy-tree-1.webp',
		caption: 'Sample caption',
		tags: []
	};
}
