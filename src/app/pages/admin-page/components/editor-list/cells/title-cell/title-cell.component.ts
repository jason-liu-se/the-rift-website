import { Component, input } from '@angular/core';
import { MarkdownComponent } from 'src/app/components/markdown/markdown.component';
import { ItemThumbnailComponent } from '../../../item-thumbnail/item-thumbnail.component';

/**
 * A list row's name: its title (plain or markdown), a line of details below
 * it, and its image beside it or (a gallery card's) on top.
 */
@Component({
	selector: 'app-title-cell',
	templateUrl: './title-cell.component.html',
	styleUrl: './title-cell.component.scss',
	imports: [ItemThumbnailComponent, MarkdownComponent],
	host: { '[class.image-on-top]': "imagePosition() === 'top'" }
})
export class TitleCellComponent {
	public readonly title = input.required<string>();
	/** Markdown: a news post's title. */
	public readonly format = input<'text' | 'markdown'>('text');
	public readonly details = input<string>();
	/** A thumbnail (a placeholder until there's an image), or none. */
	public readonly hasImage = input(false);
	public readonly imageUrl = input<string>();
	public readonly imagePosition = input<'start' | 'top'>('start');
}
