import { TestBed } from '@angular/core/testing';
import { EditorCollection } from 'src/app/interfaces/api-responses';
import {
	ListFilters,
	ListFiltersComponent,
	NO_FILTERS
} from './list-filters.component';

describe('ListFiltersComponent', () => {
	function render(collections?: EditorCollection[]) {
		TestBed.configureTestingModule({ imports: [ListFiltersComponent] });
		const fixture = TestBed.createComponent(ListFiltersComponent);
		fixture.componentRef.setInput('filters', NO_FILTERS);
		fixture.componentRef.setInput('statuses', [
			{ value: 'live', label: 'Live' }
		]);
		fixture.componentRef.setInput('searchFields', [
			{ value: 'title', label: 'Title' }
		]);
		fixture.componentRef.setInput('collections', collections);
		fixture.detectChanges();
		return fixture;
	}

	it('updates the search as the editor types', async () => {
		const fixture = render();
		let filters: ListFilters | undefined;
		fixture.componentInstance.filters.subscribe((f) => (filters = f));
		const input: HTMLInputElement = fixture.nativeElement.querySelector(
			'input[type="search"]'
		);

		input.value = 'season';
		input.dispatchEvent(new Event('input'));

		expect(filters).toEqual({ ...NO_FILTERS, search: 'season' });
	});

	it('offers a collection filter only for types with collections', () => {
		const labels = (fixture: ReturnType<typeof render>) =>
			[...fixture.nativeElement.querySelectorAll('mat-label')].map(
				(label: Element) => label.textContent
			);

		expect(labels(render())).not.toContain('Collection');
		TestBed.resetTestingModule();
		expect(
			labels(
				render([
					{
						slug: 'season5',
						title: 'Season 5',
						itemCount: 3,
						visible: true,
						revision: 1
					}
				])
			)
		).toContain('Collection');
	});
});
