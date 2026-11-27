import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TestBed } from '@angular/core/testing';
import { TOAST_DURATION_MS, Toaster } from './toaster';

describe('Toaster', () => {
	let service: Toaster;
	const cleanUp: (() => void)[] = [];
	const toasts = () => [...document.querySelectorAll('app-toast')];

	beforeEach(() => {
		vi.useFakeTimers();
		service = TestBed.inject(Toaster);
	});

	afterEach(() => {
		vi.useRealTimers();
		cleanUp.splice(0).forEach((clean) => clean());
		// Disposes the overlay container between tests.
		TestBed.resetTestingModule();
	});

	it('shows the message and announces it', () => {
		const announce = vi
			.spyOn(TestBed.inject(LiveAnnouncer), 'announce')
			.mockResolvedValue();

		service.show("You've logged out");
		TestBed.tick();

		expect(
			toasts().map(
				(toast) => toast.querySelector('.message')?.textContent
			)
		).toEqual(["You've logged out"]);
		expect(announce).toHaveBeenCalledWith("You've logged out", 'polite');
	});

	it('dismisses itself after the duration', () => {
		service.show('Saved');
		vi.advanceTimersByTime(TOAST_DURATION_MS - 1);
		expect(toasts()).toHaveLength(1);

		vi.advanceTimersByTime(1);

		expect(toasts()).toHaveLength(0);
	});

	it('dismisses with its button', () => {
		service.show('Saved');
		TestBed.tick();

		toasts()[0].querySelector<HTMLButtonElement>('button')!.click();

		expect(toasts()).toHaveLength(0);
		expect(
			document.querySelector('.cdk-overlay-container app-toast')
		).toBeNull();
	});

	it('labels its button and makes it a 44px target', () => {
		service.show('Saved');
		TestBed.tick();

		const button = toasts()[0].querySelector('button')!;

		expect(button.textContent?.trim()).toBe('Dismiss');
	});

	it('waits while hovered, then restarts the timer', () => {
		service.show('Saved');
		TestBed.tick();
		const toast = toasts()[0];

		vi.advanceTimersByTime(TOAST_DURATION_MS - 1);
		toast.dispatchEvent(new MouseEvent('mouseenter'));
		vi.advanceTimersByTime(TOAST_DURATION_MS * 2);
		expect(toasts()).toHaveLength(1);

		toast.dispatchEvent(new MouseEvent('mouseleave'));
		vi.advanceTimersByTime(TOAST_DURATION_MS - 1);
		expect(toasts()).toHaveLength(1);
		vi.advanceTimersByTime(1);

		expect(toasts()).toHaveLength(0);
	});

	it('waits while a button in it is focused', () => {
		service.show('Saved');
		TestBed.tick();
		const toast = toasts()[0];

		toast.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
		vi.advanceTimersByTime(TOAST_DURATION_MS * 2);

		expect(toasts()).toHaveLength(1);
	});

	it('moves focus to the page content when dismissed while focused', () => {
		const main = document.body.appendChild(document.createElement('main'));
		main.tabIndex = -1;
		cleanUp.push(() => main.remove());
		service.show('Saved');
		TestBed.tick();
		const button = toasts()[0].querySelector('button')!;
		button.focus();

		button.click();

		expect(document.activeElement).toBe(main);
	});

	it('replaces a toast that is already showing', () => {
		service.show('First');
		service.show('Second');
		TestBed.tick();

		expect(
			toasts().map(
				(toast) => toast.querySelector('.message')?.textContent
			)
		).toEqual(['Second']);
	});
});
