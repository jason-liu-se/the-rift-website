import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import {
	renderInlineMarkdown,
	renderMarkdown
} from 'src/app/shared/utils/markdown';

/**
 * Renders markdown (news titles and content) as HTML, which Angular sanitises
 * again. `inline` renders inline formatting only, for titles. Works on the
 * server too, so news is in the page's HTML.
 */
@Component({
	selector: 'app-markdown',
	template: '',
	styleUrl: './markdown.scss',
	// The rendered HTML isn't in the template, so scoped styles can't reach
	// it; the stylesheet scopes itself to `.markdown`.
	encapsulation: ViewEncapsulation.None,
	host: { class: 'markdown', '[innerHTML]': 'html()' }
})
export class Markdown {
	public readonly markdown = input.required<string>();
	public readonly inline = input(false);

	protected readonly html = computed(() =>
		this.inline()
			? renderInlineMarkdown(this.markdown())
			: renderMarkdown(this.markdown())
	);
}
