import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, computed, input, model, signal } from '@angular/core';
import {
	MatAutocomplete,
	MatAutocompleteSelectedEvent,
	MatAutocompleteTrigger
} from '@angular/material/autocomplete';
import {
	MatChipGrid,
	MatChipInput,
	MatChipInputEvent,
	MatChipRemove,
	MatChipRow
} from '@angular/material/chips';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatOption } from '@angular/material/select';
import {
	MAX_TAG_LENGTH,
	MAX_TAGS_PER_IMAGE
} from 'src/app/config/content-limits';
import { normalizeTag } from 'src/app/utilities/gallery-tags';

/**
 * Gallery tags as chips: type one and press Enter or a comma, or pick a
 * suggestion. Tags are normalised as they're added (trimmed, lowercase,
 * unique), as the API stores them.
 */
@Component({
	selector: 'app-tag-input',
	templateUrl: './tag-input.component.html',
	// MatAutocomplete before the chips: then picking a suggestion by keyboard
	// doesn't also add the typed text.
	imports: [
		MatAutocomplete,
		MatAutocompleteTrigger,
		MatOption,
		MatChipGrid,
		MatChipInput,
		MatChipRemove,
		MatChipRow,
		MatFormField,
		MatHint,
		MatIcon,
		MatLabel
	]
})
export class TagInputComponent {
	public readonly tags = model<string[]>([]);
	public readonly label = input('Tags');
	/** Tags to suggest, e.g. those already in the collection. */
	public readonly suggestions = input<readonly string[]>([]);
	/** The most tags; the API's per-image limit by default. */
	public readonly maxTags = input(MAX_TAGS_PER_IMAGE);

	protected readonly separatorKeys = [ENTER, COMMA];
	protected readonly maxTagLength = MAX_TAG_LENGTH;
	protected readonly typed = signal('');
	protected readonly isFull = computed(
		() => this.tags().length >= this.maxTags()
	);
	protected readonly matchingSuggestions = computed(() => {
		const typed = normalizeTag(this.typed());
		return this.suggestions().filter(
			(tag) => tag.includes(typed) && !this.tags().includes(tag)
		);
	});

	protected addTypedTag(event: MatChipInputEvent): void {
		this.addTag(event.value);
		event.chipInput.clear();
	}

	protected addSuggestion(event: MatAutocompleteSelectedEvent): void {
		this.addTag(event.option.value);
		event.option.deselect();
	}

	protected removeTag(tag: string): void {
		this.tags.update((tags) => tags.filter((existing) => existing !== tag));
	}

	protected setTyped(event: Event): void {
		this.typed.set((event.target as HTMLInputElement).value);
	}

	private addTag(text: string): void {
		const tag = normalizeTag(text).slice(0, MAX_TAG_LENGTH);
		this.typed.set('');
		if (tag && !this.tags().includes(tag) && !this.isFull()) {
			this.tags.update((tags) => [...tags, tag]);
		}
	}
}
