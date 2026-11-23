import { TestBed } from '@angular/core/testing';
import { BulkActionBarComponent } from './bulk-action-bar.component';

describe('BulkActionBarComponent', () => {
	function render(inputs: Record<string, unknown> = {}) {
		TestBed.configureTestingModule({ imports: [BulkActionBarComponent] });
		const fixture = TestBed.createComponent(BulkActionBarComponent);
		const all = {
			selectedCount: 25,
			total: 40,
			matchingCount: 40,
			noun: { one: 'post', many: 'posts' },
			...inputs
		};
		for (const [name, value] of Object.entries(all)) {
			fixture.componentRef.setInput(name, value);
		}
		fixture.detectChanges();
		const element: HTMLElement = fixture.nativeElement;
		const button = (name: string) =>
			[...element.querySelectorAll('button')].find(
				(candidate) => candidate.textContent?.trim() === name
			);
		return { fixture, element, button };
	}

	it('says how many of the matching items are selected', () => {
		const { element } = render();

		expect(element.querySelector('.count')?.textContent).toBe(
			'25 of 40 selected'
		);
	});

	it('offers to select every match once the whole page is selected', () => {
		const { fixture, button } = render({ canSelectAllMatching: true });
		const selectAll = vi.fn();
		fixture.componentInstance.selectAllMatching.subscribe(selectAll);

		button('Select all 40 posts matching')!.click();

		expect(selectAll).toHaveBeenCalled();
	});

	it('hides that offer until the whole page is selected', () => {
		expect(render().button('Select all 40 posts matching')).toBeUndefined();
	});

	it('emits the common actions, and disables them while one runs', () => {
		const { fixture, button } = render();
		const actions: string[] = [];
		fixture.componentInstance.runAction.subscribe((a) => actions.push(a));

		button('Hide')!.click();
		button('Delete')!.click();
		expect(actions).toEqual(['hide', 'delete']);

		fixture.componentRef.setInput('isBusy', true);
		fixture.detectChanges();
		expect(button('Show')!.disabled).toBe(true);
	});
});
