import { Component, computed, input, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

/**
 * A list row's image, or a placeholder when it has none or it no longer loads,
 * so titles line up either way. Decorative: the row's title names the item.
 */
@Component({
	selector: 'app-item-thumbnail',
	imports: [MatIcon],
	templateUrl: './item-thumbnail.component.html',
	styleUrl: './item-thumbnail.component.scss'
})
export class ItemThumbnailComponent {
	public readonly src = input<string>();

	private readonly failedSrc = signal<string | undefined>(undefined);
	protected readonly imageSrc = computed(() => {
		const src = this.src();
		return src !== this.failedSrc() ? src : undefined;
	});

	protected markFailed(src: string): void {
		this.failedSrc.set(src);
	}
}
