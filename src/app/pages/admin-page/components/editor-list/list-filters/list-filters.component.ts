import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { EditorCollection } from 'src/app/interfaces/api-responses';

/** A choice in a filter: what's sent, and what the editor sees. */
export interface FilterOption {
	value: string;
	label: string;
}

/** An admin list's filters, as the editor set them. */
export interface ListFilters {
	scope: 'all' | 'mine';
	/** A status, `draft` for the editor's drafts only, or '' for any. */
	status: string;
	/** A collection's slug, or '' for any. */
	collection: string;
	search: string;
	/** The fields `search` looks in; none means every field. */
	searchFields: string[];
}

export const NO_FILTERS: ListFilters = {
	scope: 'all',
	status: '',
	collection: '',
	search: '',
	searchFields: []
};

/** The filters and search above an admin list. */
@Component({
	selector: 'app-list-filters',
	templateUrl: './list-filters.component.html',
	styleUrl: './list-filters.component.scss',
	imports: [
		FormsModule,
		MatFormField,
		MatInput,
		MatLabel,
		MatOption,
		MatSelect
	]
})
export class ListFiltersComponent {
	public readonly filters = model.required<ListFilters>();
	public readonly statuses = input.required<readonly FilterOption[]>();
	public readonly searchFields = input.required<readonly FilterOption[]>();
	/** Shown as a filter when the content type has collections. */
	public readonly collections = input<readonly EditorCollection[]>();

	public setFilter<K extends keyof ListFilters>(
		key: K,
		value: ListFilters[K]
	): void {
		this.filters.update((filters) => ({ ...filters, [key]: value }));
	}
}
