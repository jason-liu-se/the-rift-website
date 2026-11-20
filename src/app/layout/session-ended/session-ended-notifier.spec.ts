import { Dialog } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ToastService } from 'src/app/components/toast/toast.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { ANY_URL_ROUTES } from 'src/app/testing/render-component';
import { SessionEndedNotifier } from './session-ended-notifier';

describe('SessionEndedNotifier', () => {
	let notifier: SessionEndedNotifier;
	let show: ReturnType<typeof vi.fn>;
	const dialogs = () => {
		TestBed.tick();
		return document.querySelectorAll('[role="alertdialog"]');
	};

	beforeEach(() => {
		show = vi.fn();
		TestBed.configureTestingModule({
			providers: [
				provideRouter(ANY_URL_ROUTES),
				{ provide: AuthService, useValue: { user: () => null } },
				{ provide: ToastService, useValue: { show } }
			]
		});
		notifier = TestBed.inject(SessionEndedNotifier);
	});

	afterEach(() => TestBed.resetTestingModule());

	it('shows a toast off a protected page', () => {
		notifier.notify('other-tab', false);

		expect(show).toHaveBeenCalledWith('Your session has ended');
		expect(dialogs()).toHaveLength(0);
	});

	it('opens the dialog on a protected page with the reason', () => {
		notifier.notify('other-tab', true);

		expect(show).not.toHaveBeenCalled();
		expect(dialogs()).toHaveLength(1);
		expect(dialogs()[0].textContent).toContain("You've logged out");
	});

	it('opens only one dialog for two ended sessions', () => {
		notifier.notify('expired', true);
		notifier.notify('other-tab', true);

		expect(dialogs()).toHaveLength(1);
	});

	it('opens the dialog again once the last one closed', () => {
		notifier.notify('expired', true);
		TestBed.inject(Dialog).closeAll();
		notifier.notify('expired', true);

		expect(dialogs()).toHaveLength(1);
	});

	it("falls back to the toast when the dialog can't be shown, and tries again next time", () => {
		const open = vi
			.spyOn(TestBed.inject(Dialog), 'open')
			.mockImplementationOnce(() => {
				throw new Error('Could not open');
			});

		notifier.notify('expired', true);
		expect(show).toHaveBeenCalledWith('Your session has ended');

		notifier.notify('expired', true);
		expect(open).toHaveBeenCalledTimes(2);
		expect(dialogs()).toHaveLength(1);
	});
});
