import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TestBed } from '@angular/core/testing';
import { TOAST_DURATION_MS, ToastService } from './toast.service';

describe('ToastService', () => {
	let service: ToastService;
	const toasts = () => [...document.querySelectorAll('app-toast')];

	beforeEach(() => {
		vi.useFakeTimers();
		service = TestBed.inject(ToastService);
	});

	afterEach(() => {
		vi.useRealTimers();
		// Disposes the overlay container between tests.
		TestBed.resetTestingModule();
	});

	it('shows the message and announces it', () => {
		const announce = vi
			.spyOn(TestBed.inject(LiveAnnouncer), 'announce')
			.mockResolvedValue();

		service.show("You've logged out");
		TestBed.tick();

		expect(toasts().map((toast) => toast.textContent?.trim())).toEqual([
			"You've logged out"
		]);
		expect(announce).toHaveBeenCalledWith("You've logged out", 'polite');
	});

	it('dismisses itself after the duration', () => {
		service.show('Saved');
		vi.advanceTimersByTime(TOAST_DURATION_MS - 1);
		expect(toasts()).toHaveLength(1);

		vi.advanceTimersByTime(1);

		expect(toasts()).toHaveLength(0);
	});

	it('replaces a toast that is already showing', () => {
		service.show('First');
		service.show('Second');
		TestBed.tick();

		expect(toasts().map((toast) => toast.textContent?.trim())).toEqual([
			'Second'
		]);
	});
});
