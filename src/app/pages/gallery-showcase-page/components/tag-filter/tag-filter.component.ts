import { Component, input, model } from '@angular/core';

/**
 * Toggle buttons for a gallery's tags. The selected tags narrow the photos to
 * those with every one of them.
 */
@Component({
	selector: 'app-tag-filter',
	templateUrl: './tag-filter.component.html',
	styleUrl: './tag-filter.component.scss'
})
export class TagFilterComponent {
	public readonly tags = input.required<readonly string[]>();
	public readonly selected = model<readonly string[]>([]);

	public isSelected(tag: string): boolean {
		return this.selected().includes(tag);
	}

	public toggleTag(tag: string): void {
		this.selected.set(
			this.isSelected(tag)
				? this.selected().filter((selected) => selected !== tag)
				: [...this.selected(), tag]
		);
	}

	public clearTags(): void {
		this.selected.set([]);
	}
}
