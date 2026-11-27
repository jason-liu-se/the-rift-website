import { TestBed } from '@angular/core/testing';
import {
	ListFilterSettings,
	NO_FILTERS,
	ShownFilterField
} from '../list-filter-fields';
import { ListFilters } from './list-filters';

const STATUS: ShownFilterField = {
	key: 'status',
	label: 'Status',
	anyLabel: 'Any',
	options: [{ value: 'live', label: 'Live' }]
};

describe('ListFilters', () => {
	function render(fields: ShownFilterField[] = [STATUS]) {
		TestBed.configureTestingModule({ imports: [ListFilters] });
		const fixture = TestBed.createComponent(ListFilters);
		fixture.componentRef.setInput('filters', NO_FILTERS);
		fixture.componentRef.setInput('fields', fields);
		fixture.componentRef.setInput('searchFields', [
			{ value: 'title', label: 'Title' }
		]);
		fixture.componentRef.setInput('sortColumns', [
			{ label: 'Updated', sort: 'updatedAt', firstOrder: 'desc' }
		]);
		fixture.componentRef.setInput('sort', {
			sort: 'updatedAt',
			order: 'desc'
		});
		fixture.detectChanges();
		return fixture;
	}

	it('updates the search as the editor types', async () => {
		const fixture = render();
		let filters: ListFilterSettings | undefined;
		fixture.componentInstance.filters.subscribe((f) => (filters = f));
		const input: HTMLInputElement = fixture.nativeElement.querySelector(
			'input[type="search"]'
		);

		input.value = 'season';
		input.dispatchEvent(new Event('input'));

		expect(filters).toEqual({ ...NO_FILTERS, search: 'season' });
	});

	it("shows each of the type's filter fields", () => {
		const labels = [
			...render([
				STATUS,
				{ ...STATUS, key: 'collection', label: 'Collection' }
			]).nativeElement.querySelectorAll('mat-label')
		].map((label: Element) => label.textContent);

		expect(labels).toEqual(['Search', 'Status', 'Collection', 'Sort by']);
	});
});
