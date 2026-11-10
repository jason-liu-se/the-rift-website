import { TestBed } from '@angular/core/testing';

import { JOIN_FORM_URL, JoinPageComponent } from './join-page.component';

describe('JoinPageComponent', () => {
	it('links Fill Out Form to the join form in a new tab', () => {
		TestBed.configureTestingModule({ imports: [JoinPageComponent] });
		const fixture = TestBed.createComponent(JoinPageComponent);
		fixture.detectChanges();

		const link: HTMLAnchorElement =
			fixture.nativeElement.querySelector('.form-button');

		expect(link.textContent).toContain('Fill Out Form');
		expect(link.getAttribute('href')).toBe(JOIN_FORM_URL);
		expect(link.target).toBe('_blank');
		expect(link.textContent).toContain('(opens in new tab)');
	});
});
