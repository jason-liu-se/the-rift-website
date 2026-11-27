import { Component, input } from '@angular/core';
import { Markdown } from 'src/app/shared/ui/markdown/markdown';
import { ItemThumbnail } from '../../../item-thumbnail/item-thumbnail';

/**
 * A list row's name: its title (plain or markdown), a line of details below
 * it, and its image beside it or (a gallery card's) on top.
 */
@Component({
	selector: 'app-title-cell',
	templateUrl: './title-cell.html',
	styleUrl: './title-cell.scss',
	imports: [ItemThumbnail, Markdown],
	host: { '[class.image-on-top]': "imagePosition() === 'top'" }
})
export class TitleCell {
	public readonly title = input.required<string>();
	/** Markdown: a news post's title. */
	public readonly format = input<'text' | 'markdown'>('text');
	public readonly details = input<string>();
	/** A thumbnail (a placeholder until there's an image), or none. */
	public readonly hasImage = input(false);
	public readonly imageUrl = input<string>();
	public readonly imagePosition = input<'start' | 'top'>('start');
}
