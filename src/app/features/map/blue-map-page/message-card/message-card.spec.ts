import { TestBed } from '@angular/core/testing';

import { renderComponent } from 'src/app/testing/render-component';
import { MessageCard } from './message-card';

describe('MessageCard', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [MessageCard] });
	});

	it('shows the title and message', () => {
		const element: HTMLElement = renderComponent(MessageCard, {
			title: 'Map offline',
			message: 'Try again later'
		}).nativeElement;

		expect(element.querySelector('h3')?.textContent).toBe('Map offline');
		expect(element.querySelector('.message')?.textContent).toBe(
			'Try again later'
		);
	});

	it('applies the colour and size inputs to the card', () => {
		const card = renderComponent(MessageCard, {
			messageColor: 'white',
			backgroundColor: 'red',
			borderColor: 'blue',
			width: '20rem',
			height: '10rem'
		}).nativeElement.querySelector('.message-card') as HTMLElement;

		expect(card.style).toMatchObject({
			color: 'white',
			backgroundColor: 'red',
			borderColor: 'blue',
			minWidth: '20rem',
			minHeight: '10rem'
		});
	});
});
