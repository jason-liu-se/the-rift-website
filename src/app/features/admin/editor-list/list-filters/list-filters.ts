import {
	Component,
	ElementRef,
	computed,
	inject,
	input,
	model,
	output,
	signal
} from '@angular/core';
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
import {
	FilterOption,
	ListFilterSettings,
	NO_FILTERS,
	ShownFilterField,
	countSetFilters
} from '../list-filter-fields';
import { ListSort, SortColumn } from '../list-sort';

/** The search, filters, and sort above an admin list. */
@Component({
	selector: 'app-list-filters',
	templateUrl: './list-filters.html',
	styleUrl: './list-filters.scss',
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
export class ListFilters {
	private host = inject<ElementRef<HTMLElement>>(ElementRef);

	public readonly filters = model.required<ListFilterSettings>();
	/** The type's filters beside search. */
	public readonly fields = input.required<readonly ShownFilterField[]>();
	public readonly searchFields = input.required<readonly FilterOption[]>();
	public readonly sortColumns = input.required<readonly SortColumn[]>();
	public readonly sort = input.required<ListSort>();
	/** On desktop too: a list without column headings (the gallery's cards). */
	public readonly isSortShown = input(false);
	public readonly sortChange = output<ListSort>();

	/** Mobile: the filters other than search are behind a button. */
	protected readonly isShowingMore = signal(false);

	/** How many filters other than search are set, for the mobile button. */
	protected readonly activeCount = computed(() =>
		countSetFilters(this.filters())
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

	/** A column, in the direction it sorts in first. */
	protected sortBy(sort: string): void {
		const column = this.sortColumns().find((each) => each.sort === sort);
		if (column) {
			this.sortChange.emit({ sort, order: column.firstOrder });
		}
	}

	protected reverseSort(): void {
		const { sort, order } = this.sort();
		this.sortChange.emit({ sort, order: order === 'asc' ? 'desc' : 'asc' });
	}

	/** Clears the search and filters, keeping the sort. */
	protected clear(): void {
		const { sort, order } = this.filters();
		this.filters.set({ ...NO_FILTERS, sort, order });
	}

	public focusSearch(): void {
		this.host.nativeElement
			.querySelector<HTMLInputElement>('input[type="search"]')
			?.focus();
	}

	public setFilter<K extends 'search' | 'searchFields'>(
		key: K,
		value: ListFilterSettings[K]
	): void {
		this.filters.update((filters) => ({ ...filters, [key]: value }));
	}

	/** One filter field's value; '' unsets it. */
	protected setValue(key: string, value: string): void {
		this.filters.update((filters) => {
			const values = { ...filters.values, [key]: value };
			if (!value) {
				delete values[key];
			}
			return { ...filters, values };
		});
	}
}
