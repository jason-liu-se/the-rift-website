import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { apiStatusInterceptor } from '../../services/api-status/api-status.interceptor';
import { ApiStatusService } from '../../services/api-status/api-status.service';
import { stubResizeObserver } from '../testing/resize-observer';
import { StatusBannerComponent } from './status-banner.component';

@Component({ template: '' })
class EmptyPageComponent {}

const DOWN = "The Rift's services are down. Changes can't be saved right now.";

describe('StatusBannerComponent', () => {
	let fixture: ComponentFixture<StatusBannerComponent>;
	let element: HTMLElement;
	let apiStatus: ApiStatusService;
	let router: Router;

	let resize: () => void;

	beforeEach(() => {
		resize = stubResizeObserver();
		TestBed.configureTestingModule({
			imports: [StatusBannerComponent],
			providers: [
				provideRouter([
					{ path: '', component: EmptyPageComponent },
					{ path: 'other', component: EmptyPageComponent }
				]),
				provideHttpClient(withInterceptors([apiStatusInterceptor])),
				provideHttpClientTesting()
			]
		});
		apiStatus = TestBed.inject(ApiStatusService);
		router = TestBed.inject(Router);
		fixture = TestBed.createComponent(StatusBannerComponent);
		element = fixture.nativeElement;
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	const settle = async () => {
		await fixture.whenStable();
		TestBed.tick();
		fixture.detectChanges();
	};
	const text = () => element.querySelector('.banner')?.textContent?.trim();
	const dismissButton = () =>
		element.querySelector<HTMLButtonElement>('.dismiss');
	const goDown = async () => {
		apiStatus.reportDown();
		await settle();
	};
	const recover = async () => {
		apiStatus.reportUp();
		await settle();
	};
	const goOffline = async () => {
		window.dispatchEvent(new Event('offline'));
		await settle();
	};
	const goOnline = async () => {
		window.dispatchEvent(new Event('online'));
		await settle();
	};
	const navigate = async (url: string) => {
		await router.navigateByUrl(url);
		await settle();
	};

	beforeEach(async () => {
		await navigate('/');
	});

	it('shows nothing while the API is up, in a live region that is always present', () => {
		expect(text()).toBeUndefined();
		expect(element.querySelector('[role="status"]')).not.toBeNull();
	});

	it('says the services are down', async () => {
		await goDown();

		expect(text()).toContain(DOWN);
		expect(element.querySelector('.banner')?.classList).toContain(
			'warning'
		);
	});

	it("says you're offline", async () => {
		await goOffline();

		expect(text()).toContain("You're offline.");
	});

	it('says "Back online" after the API recovers', async () => {
		await goDown();
		await recover();

		expect(text()).toContain('Back online');
		expect(element.querySelector('.banner')?.classList).toContain(
			'success'
		);
	});

	it('says "Back online" after coming back online', async () => {
		await goOffline();
		await goOnline();

		expect(text()).toContain('Back online');
	});

	it('switches to the down message, not "Back online", when online again with the API still down', async () => {
		await goDown();
		await goOffline();
		await goOnline();

		expect(text()).toContain(DOWN);
	});

	it('hides "Back online" on the next navigation', async () => {
		await goDown();
		await recover();
		await navigate('/other');

		expect(text()).toBeUndefined();
	});

	it('keeps the down message across navigations, then just disappears on recovery', async () => {
		await goDown();
		await navigate('/other');
		expect(text()).toContain(DOWN);

		await recover();
		expect(text()).toBeUndefined();
	});

	it('dismisses the "Back online" message', async () => {
		await goDown();
		await recover();
		dismissButton()!.click();
		await settle();

		expect(text()).toBeUndefined();
	});

	describe('dismissing an outage', () => {
		beforeEach(async () => {
			await goDown();
			dismissButton()!.click();
			await settle();
		});

		it('hides the banner, even across navigations', async () => {
			expect(text()).toBeUndefined();

			await navigate('/other');
			expect(text()).toBeUndefined();
		});

		it('also hides a later offline state of the same outage', async () => {
			await goOffline();

			expect(text()).toBeUndefined();
		});

		it('suppresses "Back online"', async () => {
			await recover();

			expect(text()).toBeUndefined();
		});

		it('shows the banner again for a new outage', async () => {
			await recover();
			await goDown();

			expect(text()).toContain(DOWN);
		});
	});

	it('moves focus to <main> when the focused dismiss button goes away', async () => {
		const main = document.createElement('main');
		main.tabIndex = -1;
		document.body.append(main, element);
		await goDown();

		dismissButton()!.focus();
		dismissButton()!.click();
		await settle();

		expect(document.activeElement).toBe(main);
		main.remove();
		element.remove();
	});

	it('names the dismiss button for screen readers', async () => {
		await goDown();

		expect(dismissButton()?.getAttribute('aria-label')).toBe('Dismiss');
	});

	it('publishes its height as --status-banner-height', () => {
		resize();

		expect(
			document.documentElement.style.getPropertyValue(
				'--status-banner-height'
			)
		).toBe('0px');
	});
});
