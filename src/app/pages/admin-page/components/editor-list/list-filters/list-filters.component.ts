import { Component, computed, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
	MatFormField,
	MatLabel,
	MatPrefix,
	MatSuffix
} from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatTooltip } from '@angular/material/tooltip';
import { EditorCollection } from 'src/app/interfaces/api-responses';
import { SortOption } from '../../../editor-types';

/** A choice in a filter: what's sent, and what the editor sees. */
export interface FilterOption {
	value: string;
	label: string;
}

/** An admin list's filters, as the editor set them. */
export interface ListFilters {
	scope: 'all' | 'mine';
	/** A status, `draft` for the drafts only, or '' for any. */
	status: string;
	/** A collection's slug, or '' for any. */
	collection: string;
	search: string;
	/** The fields `search` looks in; none means every field. */
	searchFields: string[];
	/** A sort option's `sort`, or '' for the type's first (default) one. */
	sort: string;
}

export const NO_FILTERS: ListFilters = {
	scope: 'all',
	status: '',
	collection: '',
	search: '',
	searchFields: [],
	sort: ''
};

/** The search, filters, and sort above an admin list. */
@Component({
	selector: 'app-list-filters',
	templateUrl: './list-filters.component.html',
	styleUrl: './list-filters.component.scss',
	imports: [
		FormsModule,
		MatButton,
		MatFormField,
		MatIcon,
		MatIconButton,
		MatInput,
		MatLabel,
		MatMenu,
		MatMenuItem,
		MatMenuTrigger,
		MatOption,
		MatPrefix,
		MatSelect,
		MatSuffix,
		MatTooltip
	]
})
export class ListFiltersComponent {
	public readonly filters = model.required<ListFilters>();
	public readonly statuses = input.required<readonly FilterOption[]>();
	public readonly searchFields = input.required<readonly FilterOption[]>();
	public readonly sortOptions = input.required<readonly SortOption[]>();
	/** Shown as a filter when the content type has collections. */
	public readonly collections = input<readonly EditorCollection[]>();

	/** Mobile: the filters other than search are behind a button. */
	protected readonly isShowingMore = signal(false);

	/** How many filters other than search are set, for the mobile button. */
	protected readonly activeCount = computed(() => {
		const { status, collection, scope, searchFields } = this.filters();
		return [
			status,
			collection,
			scope === 'mine',
			searchFields.length > 0
		].filter(Boolean).length;
	});
	protected readonly selectedSort = computed(
		() => this.filters().sort || this.sortOptions()[0]?.sort
	);
	protected readonly searchInText = computed(() => {
		const chosen = this.filters().searchFields;
		const labels = this.searchFields()
			.filter(({ value }) => chosen.includes(value))
			.map(({ label }) => label);
		return labels.length > 0 ? labels.join(', ') : 'Everything';
	});
	protected readonly searchLabel = computed(() =>
		this.filters().searchFields.length > 0
			? `Search ${this.searchInText().toLowerCase()}`
			: 'Search'
	);

	protected isSearchedIn(field: string): boolean {
		return this.filters().searchFields.includes(field);
	}

	/** Keeps the menu open, to pick several. */
	protected toggleSearchField(field: string, event: Event): void {
		event.stopPropagation();
		const fields = this.filters().searchFields;
		this.setFilter(
			'searchFields',
			fields.includes(field)
				? fields.filter((each) => each !== field)
				: [...fields, field]
		);
	}

	/** The default sort leaves the URL. */
	protected setSort(sort: string): void {
		this.setFilter(
			'sort',
			sort === this.sortOptions()[0]?.sort ? '' : sort
		);
	}

	/** Clears the search and filters, keeping the sort. */
	protected clear(): void {
		this.filters.set({ ...NO_FILTERS, sort: this.filters().sort });
	}

	public setFilter<K extends keyof ListFilters>(
		key: K,
		value: ListFilters[K]
	): void {
		this.filters.update((filters) => ({ ...filters, [key]: value }));
	}
}
