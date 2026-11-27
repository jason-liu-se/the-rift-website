import { TestBed } from '@angular/core/testing';

import { JOIN_FORM_URL } from '../../../core/config/site';
import { JoinPage } from './join-page';

describe('JoinPage', () => {
	it('links Fill Out Form to the join form in a new tab', () => {
		TestBed.configureTestingModule({ imports: [JoinPage] });
		const fixture = TestBed.createComponent(JoinPage);
		fixture.detectChanges();

		const link: HTMLAnchorElement =
			fixture.nativeElement.querySelector('.form-button');

		expect(link.textContent).toContain('Fill Out Form');
		expect(link.getAttribute('href')).toBe(JOIN_FORM_URL);
		expect(link.target).toBe('_blank');
		expect(link.textContent).toContain('(opens in new tab)');
	});
});
