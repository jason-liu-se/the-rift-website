import { Component } from '@angular/core';
import { toPlainText } from 'src/app/utilities/markdown';
import { formatDateTime } from '../../utilities/format-date-time';
import { ContentToolComponent } from '../content-tool/content-tool.component';
import { FilterOption } from '../editor-list/list-filters/list-filters.component';
import { NewsFormComponent } from './news-form/news-form.component';

/** Creates, edits, schedules, and deletes news posts. */
@Component({
	selector: 'app-news-tool',
	templateUrl: './news-tool.component.html',
	styleUrl: './news-tool.component.scss',
	imports: [ContentToolComponent, NewsFormComponent]
})
export class NewsToolComponent {
	protected readonly noun = { one: 'post', many: 'posts' };
	protected readonly searchFields: FilterOption[] = [
		{ value: 'title', label: 'Title' },
		{ value: 'content', label: 'Content' }
	];
	protected readonly formatDateTime = formatDateTime;
	/** Plain titles: the name opens the post, so it can't hold a title's links. */
	protected readonly toPlainText = toPlainText;
}
