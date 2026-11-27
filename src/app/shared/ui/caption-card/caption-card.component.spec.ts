import { TestBed } from '@angular/core/testing';

import { renderComponent } from 'src/app/testing/render-component';
import { CaptionCardComponent } from './caption-card.component';

function render(inputs: Partial<CaptionCardComponent> = {}): HTMLElement {
	return renderComponent(CaptionCardComponent, {
		src: 'assets/test-image.png',
		...inputs
	}).nativeElement;
}

describe('CaptionCardComponent', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [CaptionCardComponent] });
	});

	it('shows the image and caption', () => {
		const element = render({ alt: 'A castle', caption: 'Spawn castle' });
		const image = element.querySelector('img');

		expect(image?.getAttribute('src')).toBe('assets/test-image.png');
		expect(image?.alt).toBe('A castle');
		expect(element.querySelector('.caption-text')?.textContent).toBe(
			'Spawn castle'
		);
	});

	it.each([
		{ captionVisibility: 'hidden', expectedClass: 'hidden' },
		{ captionVisibility: 'hover', expectedClass: 'hover' },
		{ captionVisibility: 'visible', expectedClass: 'visible' },
		{ captionVisibility: undefined, expectedClass: 'visible' }
	])(
		'applies the "$expectedClass" caption class when captionVisibility is $captionVisibility',
		({ captionVisibility, expectedClass }) => {
			const overlay = render({ captionVisibility }).querySelector(
				'.overlay-elements'
			);

			expect(overlay?.classList).toContain(expectedClass);
		}
	);
});
