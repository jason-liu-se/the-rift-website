import { TestBed } from '@angular/core/testing';

import { renderComponent } from 'src/app/testing/render-component';
import { MessageCardComponent } from './message-card.component';

describe('MessageCardComponent', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({ imports: [MessageCardComponent] });
	});

	it('shows the title and message', () => {
		const element: HTMLElement = renderComponent(MessageCardComponent, {
			title: 'Map offline',
			message: 'Try again later'
		}).nativeElement;

		expect(element.querySelector('h3')?.textContent).toBe('Map offline');
		expect(element.querySelector('.message')?.textContent).toBe(
			'Try again later'
		);
	});

	it('applies the colour and size inputs to the card', () => {
		const card = renderComponent(MessageCardComponent, {
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
