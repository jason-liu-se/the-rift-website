import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SNACKBAR_SUCCESS_DURATION_MS } from 'src/app/config/admin';
import { AdminNotifierService } from './admin-notifier.service';

describe('AdminNotifierService', () => {
	let open: ReturnType<typeof vi.fn>;
	let notifier: AdminNotifierService;

	beforeEach(() => {
		open = vi.fn();
		TestBed.configureTestingModule({
			providers: [{ provide: MatSnackBar, useValue: { open } }]
		});
		notifier = TestBed.inject(AdminNotifierService);
	});

	it('shows a success for a few seconds', () => {
		notifier.notify({ message: 'Deleted 1 post.', hasFailures: false });

		expect(open).toHaveBeenCalledWith('Deleted 1 post.', 'OK', {
			duration: SNACKBAR_SUCCESS_DURATION_MS
		});
	});

	it('keeps a failure until it is dismissed, and announces it at once', () => {
		notifier.notify({ message: 'Failed.', hasFailures: true });

		const [, action, config] = open.mock.calls[0];
		expect(action).toBe('Dismiss');
		expect(config.duration).toBeUndefined();
		expect(config.politeness).toBe('assertive');
	});
});
