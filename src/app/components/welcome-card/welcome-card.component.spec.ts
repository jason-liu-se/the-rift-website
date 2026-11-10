import { TestBed } from '@angular/core/testing';

import { renderComponent } from 'src/app/testing/render-component';
import { WelcomeCardComponent } from './welcome-card.component';

function render(inputs: Partial<WelcomeCardComponent> = {}): HTMLElement {
	return renderComponent(WelcomeCardComponent, inputs).nativeElement;
}

describe('WelcomeCardComponent', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [WelcomeCardComponent] });
	});

	it('shows the header image and description', () => {
		const element = render({
			headerUrl: 'assets/logo.png',
			headerAlt: 'The Rift',
			desc: 'Welcome to The Rift'
		});
		const header = element.querySelector('.image-header img');

		expect(header?.getAttribute('src')).toBe('assets/logo.png');
		expect(header?.getAttribute('alt')).toBe('The Rift');
		expect(element.querySelector('.description')?.textContent?.trim()).toBe(
			'Welcome to The Rift'
		);
	});

	it('uses backgroundUrl as the background image', () => {
		const card = render({
			backgroundUrl: 'assets/spawn.png'
		}).querySelector<HTMLElement>('.card');

		expect(card?.style.backgroundImage).toContain('assets/spawn.png');
	});

	it.each(['', null])(
		'has no background image when backgroundUrl is %j',
		(backgroundUrl) => {
			const card = render({ backgroundUrl }).querySelector<HTMLElement>(
				'.card'
			);

			expect(card?.style.backgroundImage).toBe('');
		}
	);
});
