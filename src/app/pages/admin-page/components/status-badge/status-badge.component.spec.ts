import { TestBed } from '@angular/core/testing';
import { ItemStatus, StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
	function render(status: ItemStatus, date?: string, hasDraft = false) {
		TestBed.configureTestingModule({ imports: [StatusBadgeComponent] });
		const fixture = TestBed.createComponent(StatusBadgeComponent);
		fixture.componentRef.setInput('status', status);
		fixture.componentRef.setInput('date', date);
		fixture.componentRef.setInput('hasDraft', hasDraft);
		fixture.detectChanges();
		const element: HTMLElement = fixture.nativeElement;
		return element.textContent?.replace(/\s+/g, ' ').trim();
	}

	it.each<[ItemStatus, string]>([
		['live', 'Live'],
		['hidden', 'Hidden'],
		['draft', 'Draft']
	])('shows %s as "%s"', (status, label) => {
		expect(render(status)).toBe(label);
	});

	it('shows when a scheduled post goes live', () => {
		expect(render('scheduled', '2026-03-04T12:30:00')).toBe(
			'Scheduled 4 Mar 2026, 12:30'
		);
	});

	it('says when the editor has a draft of the item', () => {
		expect(render('live', undefined, true)).toBe('Live Has your draft');
	});
});
