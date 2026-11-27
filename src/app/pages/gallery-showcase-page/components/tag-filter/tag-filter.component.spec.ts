import { TestBed } from '@angular/core/testing';
import { TagFilterComponent } from './tag-filter.component';

describe('TagFilterComponent', () => {
	function render(selected: string[] = []) {
		TestBed.configureTestingModule({ imports: [TagFilterComponent] });
		const fixture = TestBed.createComponent(TagFilterComponent);
		fixture.componentRef.setInput('tags', ['night', 'spawn']);
		fixture.componentRef.setInput('selected', selected);
		fixture.detectChanges();
		const element: HTMLElement = fixture.nativeElement;
		const button = (name: string) =>
			[...element.querySelectorAll('button')].find(
				(candidate) => candidate.textContent?.trim() === name
			)!;
		return { fixture, element, button };
	}

	it('shows a toggle button per tag, pressed when selected', () => {
		const { button } = render(['spawn']);

		expect(button('night').getAttribute('aria-pressed')).toBe('false');
		expect(button('spawn').getAttribute('aria-pressed')).toBe('true');
	});

	it('adds and removes tags from the selection', () => {
		const { fixture, button } = render(['spawn']);

		button('night').click();
		expect(fixture.componentInstance.selected()).toEqual([
			'spawn',
			'night'
		]);

		button('spawn').click();
		expect(fixture.componentInstance.selected()).toEqual(['night']);
	});

	it('offers to clear the selection only when something is selected', () => {
		const { fixture, button } = render();
		expect(button('Clear')).toBeUndefined();

		fixture.componentRef.setInput('selected', ['night']);
		fixture.detectChanges();
		button('Clear').click();

		expect(fixture.componentInstance.selected()).toEqual([]);
	});
});
