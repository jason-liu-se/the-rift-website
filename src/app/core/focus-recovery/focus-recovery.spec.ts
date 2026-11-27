import { TestBed } from '@angular/core/testing';

import { FocusRecovery } from './focus-recovery';

describe('FocusRecovery', () => {
	let service: FocusRecovery;
	let main: HTMLElement;
	let button: HTMLButtonElement;

	beforeEach(() => {
		main = document.createElement('main');
		main.tabIndex = -1;
		button = document.createElement('button');
		main.appendChild(button);
		document.body.appendChild(main);
		service = TestBed.inject(FocusRecovery);
	});

	afterEach(() => main.remove());

	it('reports focus as lost once the focused element is removed', () => {
		button.focus();
		expect(service.wasFocusLost()).toBe(false);

		button.remove();

		expect(service.wasFocusLost()).toBe(true);
	});

	it('does not count the first page load, before anything was focused', () => {
		expect(service.wasFocusLost()).toBe(false);
	});

	it('focuses <main> after the next render when focus was lost', () => {
		button.focus();
		button.remove();

		service.recoverAfterRender();
		TestBed.tick();

		expect(document.activeElement).toBe(main);
	});

	it('leaves focus alone when it was not lost', () => {
		button.focus();

		service.recoverAfterRender();
		TestBed.tick();

		expect(document.activeElement).toBe(button);
	});
});
