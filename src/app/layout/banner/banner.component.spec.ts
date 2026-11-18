import { ComponentFixture, TestBed } from '@angular/core/testing';

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
		// jsdom has no ResizeObserver; this one lets a test trigger a resize.
		vi.stubGlobal(
			'ResizeObserver',
			class {
				constructor(callback: () => void) {
					resize = callback;
				}
				observe = vi.fn();
				disconnect = vi.fn();
			}
		);
		TestBed.configureTestingModule({
			providers: [{ provide: OfflineBannerService, useValue: { watch } }]
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

	it('starts watching the connection once rendered in the browser', () => {
		expect(watch).toHaveBeenCalled();
	});

	it('shows each banner with its variant and role', () => {
		service.show({ id: 'a', variant: 'warning', message: 'Offline' });
		service.show({ id: 'b', variant: 'success', message: 'Saved' });
		fixture.detectChanges();

		const [offline, saved] = banners();

		expect(offline.textContent?.trim()).toBe('Offline');
		expect(offline.classList).toContain('warning');
		expect(offline.getAttribute('role')).toBe('alert');
		expect(saved.textContent?.trim()).toBe('Saved');
		expect(saved.classList).toContain('success');
		expect(saved.getAttribute('role')).toBe('status');
	});

	it('removes a banner when its Dismiss button is clicked', () => {
		service.show({ id: 'a', variant: 'error', message: 'Down' });
		fixture.detectChanges();

		element
			.querySelector<HTMLButtonElement>('button[aria-label="Dismiss"]')!
			.click();
		fixture.detectChanges();

		expect(banners()).toHaveLength(0);
		expect(service.banners()).toEqual([]);
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
