import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { FocusRecoveryService } from '../page-template/focus-recovery.service';
import { stubResizeObserver } from '../testing/resize-observer';
import { BANNER_HEIGHT_VARIABLE, BannerComponent } from './banner.component';
import { BannerService } from './banner.service';
import { OfflineBannerService } from './offline-banner.service';

describe('BannerComponent', () => {
	let fixture: ComponentFixture<BannerComponent>;
	let element: HTMLElement;
	let service: BannerService;
	let resize: () => void;
	const watch = vi.fn();

	beforeEach(() => {
		resize = stubResizeObserver();
		TestBed.configureTestingModule({
			providers: [
				provideRouter([]),
				{ provide: OfflineBannerService, useValue: { watch } }
			]
		});
		service = TestBed.inject(BannerService);
		fixture = TestBed.createComponent(BannerComponent);
		element = fixture.nativeElement;
		fixture.detectChanges();
		TestBed.tick();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		document.documentElement.style.removeProperty(BANNER_HEIGHT_VARIABLE);
	});

	const banners = () => [...element.querySelectorAll('.banner')];
	const show = (id: string, message: string) => {
		service.show({ id, variant: 'warning', message });
		fixture.detectChanges();
	};

	it('starts watching the connection once rendered in the browser', () => {
		expect(watch).toHaveBeenCalled();
	});

	it('renders the notices landmark only while there are banners', () => {
		expect(element.querySelector('section')).toBeNull();

		show('a', 'Offline');

		expect(
			element.querySelector('section')?.getAttribute('aria-label')
		).toBe('Site notices');
	});

	it('shows each banner with its variant, leaving announcing to the service', () => {
		service.show({ id: 'a', variant: 'warning', message: 'Offline' });
		service.show({ id: 'b', variant: 'success', message: 'Saved' });
		fixture.detectChanges();
		const [offline, saved] = banners();

		expect(offline.textContent?.trim()).toBe('Offline');
		expect(offline.classList).toContain('warning');
		expect(saved.classList).toContain('success');
		expect(element.querySelector('[role]')).toBeNull();
	});

	it('keeps the same element when a banner with the same id is replaced', () => {
		show('a', 'Offline');
		const first = banners()[0];

		show('a', 'Still offline');

		expect(banners()[0]).toBe(first);
		expect(first.textContent?.trim()).toBe('Still offline');
	});

	it('removes a banner with its Dismiss button and recovers focus', () => {
		const recover = vi
			.spyOn(TestBed.inject(FocusRecoveryService), 'recoverAfterRender')
			.mockImplementation(() => undefined);
		show('a', 'Down');

		element
			.querySelector<HTMLButtonElement>(
				'button[aria-label="Dismiss: Down"]'
			)!
			.click();
		fixture.detectChanges();

		expect(banners()).toHaveLength(0);
		expect(service.banners()).toEqual([]);
		expect(recover).toHaveBeenCalled();
	});

	it('publishes its height so the navbar and page move below it', () => {
		vi.spyOn(element, 'offsetHeight', 'get').mockReturnValue(48);

		resize();

		expect(
			document.documentElement.style.getPropertyValue(
				BANNER_HEIGHT_VARIABLE
			)
		).toBe('48px');
	});
});
