import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { ICardSelection } from 'src/app/interfaces/card-selection.interface';
import {
	ANY_URL_ROUTES,
	renderComponent
} from 'src/app/testing/render-component';
import { CardSelectionSectionComponent } from './card-selection-section.component';

const ITEMS: ICardSelection[] = [
	{
		imageUrl: 'assets/a.png',
		routerLink: '/gallery/a',
		title: 'Collection A',
		desc: 'About A'
	},
	{
		imageUrl: 'assets/b.png',
		routerLink: '/gallery/b',
		title: 'Collection B'
	}
];

function render(
	inputs: Partial<CardSelectionSectionComponent> = {}
): HTMLElement {
	return renderComponent(CardSelectionSectionComponent, {
		items: ITEMS,
		...inputs
	}).nativeElement;
}

describe('CardSelectionSectionComponent', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [CardSelectionSectionComponent],
			providers: [provideRouter(ANY_URL_ROUTES)]
		});
	});

	it('renders a linked card with title and image for each item', () => {
		const cards = render().querySelectorAll('.collection-card');

		expect(cards).toHaveLength(ITEMS.length);
		cards.forEach((card, i) => {
			expect(card.querySelector('h3')?.textContent).toBe(ITEMS[i].title);
			expect(card.querySelector('a')?.getAttribute('href')).toBe(
				ITEMS[i].routerLink
			);
			expect(
				card.querySelector<HTMLElement>('.background-content')?.style
					.backgroundImage
			).toContain(ITEMS[i].imageUrl);
		});
	});

	it('renders a description only for items that have one', () => {
		const cards = render().querySelectorAll('.collection-card');

		expect(
			cards[0].querySelector('.description')?.textContent?.trim()
		).toBe('About A');
		expect(cards[1].querySelector('.description')).toBeNull();
	});

	it('hides descriptions until hover by default', () => {
		const description = render().querySelector('.description');

		expect(description?.classList).toContain('transparent');
	});

	it('always shows descriptions when alwaysShowDesc is true', () => {
		const description = render({ alwaysShowDesc: true }).querySelector(
			'.description'
		);

		expect(description?.classList).toContain('high-contrast');
		expect(description?.classList).not.toContain('transparent');
	});

	it('navigates to the item route when a card link is clicked', async () => {
		const fixture = renderComponent(CardSelectionSectionComponent, {
			items: ITEMS
		});

		fixture.nativeElement.querySelectorAll('a')[1].click();
		await fixture.whenStable();

		expect(TestBed.inject(Router).url).toBe('/gallery/b');
	});
});
