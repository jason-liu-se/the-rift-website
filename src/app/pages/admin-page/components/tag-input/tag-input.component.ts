import {
	Component,
	ElementRef,
	computed,
	input,
	model,
	signal,
	viewChild
} from '@angular/core';
import {
	MatAutocomplete,
	MatAutocompleteSelectedEvent,
	MatAutocompleteTrigger
} from '@angular/material/autocomplete';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatOption } from '@angular/material/select';
import {
	MAX_TAG_LENGTH,
	MAX_TAGS_PER_IMAGE
} from 'src/app/config/content-limits';
import { normalizeTag } from 'src/app/utilities/gallery-tags';

/**
 * Gallery tags: type one and press Enter or a comma, or pick a suggestion.
 * The chosen tags list below the field. Tags are normalised as they're added
 * (trimmed, lowercase, unique), as the API stores them.
 */
@Component({
	selector: 'app-tag-input',
	templateUrl: './tag-input.component.html',
	styleUrl: './tag-input.component.scss',
	imports: [
		MatAutocomplete,
		MatAutocompleteTrigger,
		MatFormField,
		MatHint,
		MatIcon,
		MatInput,
		MatLabel,
		MatOption
	]
})
export class TagInputComponent {
	private textInput =
		viewChild.required<ElementRef<HTMLInputElement>>('textInput');
	private trigger = viewChild.required(MatAutocompleteTrigger);

	public readonly tags = model<string[]>([]);
	public readonly label = input('Tags');
	/** Tags to suggest, e.g. those already in the collection. */
	public readonly suggestions = input<readonly string[]>([]);
	/** The most tags; the API's per-image limit by default. */
	public readonly maxTags = input(MAX_TAGS_PER_IMAGE);

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

	/** Enter or a comma adds what's typed, unless a suggestion is active. */
	protected addOnKey(event: KeyboardEvent): void {
		const isSeparator = event.key === 'Enter' || event.key === ',';
		if (!isSeparator || this.trigger().activeOption) {
			return;
		}
		event.preventDefault();
		this.addTag(this.typed());
	}

	/** Leaving the field adds what's typed, unless it's to pick a suggestion. */
	protected addOnBlur(): void {
		if (!this.trigger().panelOpen) {
			this.addTag(this.typed());
		}
	}

	protected addSuggestion(event: MatAutocompleteSelectedEvent): void {
		this.addTag(event.option.value);
		event.option.deselect();
	}

	/** Focus goes back to the field, as the removed tag's button goes. */
	protected removeTag(tag: string): void {
		this.tags.update((tags) => tags.filter((existing) => existing !== tag));
		this.textInput().nativeElement.focus();
	}

	protected setTyped(event: Event): void {
		this.typed.set((event.target as HTMLInputElement).value);
	}

	private addTag(text: string): void {
		const tag = normalizeTag(text).slice(0, MAX_TAG_LENGTH);
		this.typed.set('');
		this.textInput().nativeElement.value = '';
		if (tag && !this.tags().includes(tag) && !this.isFull()) {
			this.tags.update((tags) => [...tags, tag]);
		}
	}
}
