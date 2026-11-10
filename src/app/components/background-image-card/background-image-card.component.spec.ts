import { TestBed } from '@angular/core/testing';

import { renderComponent } from 'src/app/testing/render-component';
import { BackgroundImageCardComponent } from './background-image-card.component';

const SRC = 'assets/test-image.png';
const TITLE = 'Card title';
const DESC = 'Card description';

function render(
	inputs: Partial<BackgroundImageCardComponent> = {}
): HTMLElement {
	return renderComponent(BackgroundImageCardComponent, {
		src: SRC,
		...inputs
	}).nativeElement;
}

describe('BackgroundImageCardComponent', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [BackgroundImageCardComponent]
		});
	});

	it('uses src as the background image', () => {
		const card = render().querySelector<HTMLElement>(
			'.background-image-card'
		);

		expect(card?.style.backgroundImage).toContain(SRC);
	});

	describe('title', () => {
		it('renders an <h2> by default', () => {
			const element = render({ title: TITLE });

			expect(element.querySelector('h2')?.textContent).toBe(TITLE);
			expect(element.querySelector('h1')).toBeNull();
		});

		it('renders an <h1> when isPageTitle is true', () => {
			const element = render({ title: TITLE, isPageTitle: true });

			expect(element.querySelector('h1')?.textContent).toBe(TITLE);
			expect(element.querySelector('h2')).toBeNull();
		});

		it('renders no heading when title is empty', () => {
			const element = render({ isPageTitle: true });

			expect(element.querySelector('h1, h2')).toBeNull();
		});
	});

	describe('description', () => {
		it('renders the description when desc is set', () => {
			const element = render({ desc: DESC });

			expect(element.querySelector('.description')?.textContent).toBe(
				DESC
			);
		});

		it('renders no description when desc is empty', () => {
			const element = render();

			expect(element.querySelector('.description')).toBeNull();
		});
	});

	it('renders the title and description together', () => {
		const element = render({ title: TITLE, desc: DESC });

		expect(element.querySelector('h2')?.textContent).toBe(TITLE);
		expect(element.querySelector('.description')?.textContent).toBe(DESC);
	});
});
