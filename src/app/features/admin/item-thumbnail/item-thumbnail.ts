import { Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { untilLoadFails } from 'src/app/shared/utils/image-load-failure';

/**
 * A list row's image, or a placeholder when it has none or it no longer loads,
 * so titles line up either way. Decorative: the row's title names the item.
 */
@Component({
	selector: 'app-item-thumbnail',
	imports: [MatIcon],
	templateUrl: './item-thumbnail.html',
	styleUrl: './item-thumbnail.scss'
})
export class ItemThumbnail {
	public readonly src = input<string>();

	protected readonly image = untilLoadFails(this.src);
}
