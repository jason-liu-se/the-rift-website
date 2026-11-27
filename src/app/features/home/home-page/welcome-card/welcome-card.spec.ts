import { TestBed } from '@angular/core/testing';

import { renderComponent } from 'src/app/testing/render-component';
import { WelcomeCard } from './welcome-card';

function render(inputs: Partial<WelcomeCard> = {}): HTMLElement {
	return renderComponent(WelcomeCard, inputs).nativeElement;
}

describe('WelcomeCard', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [WelcomeCard] });
	});

	it('shows the header image, as the page heading, and the description', () => {
		const element = render({
			headerUrl: 'assets/logo.png',
			headerAlt: 'The Rift',
			desc: 'Welcome to The Rift'
		});
		const header = element.querySelector('h1.image-header img');

		expect(header?.getAttribute('src')).toBe('assets/logo.png');
		expect(header?.getAttribute('alt')).toBe('The Rift');
		expect(element.querySelector('.description')?.textContent?.trim()).toBe(
			'Welcome to The Rift'
		);
	});

	it('shows backgroundUrl as a decorative, eagerly loaded background image', () => {
		const image = render({
			backgroundUrl: 'assets/spawn.png'
		}).querySelector('.background img');

		expect(image?.getAttribute('src')).toBe('assets/spawn.png');
		expect(image?.getAttribute('alt')).toBe('');
		expect(image?.getAttribute('fetchpriority')).toBe('high');
	});

	it.each(['', null])(
		'has no background image when backgroundUrl is %j',
		(backgroundUrl) => {
			expect(
				render({ backgroundUrl }).querySelector('.background img')
			).toBeNull();
		}
	);
});
