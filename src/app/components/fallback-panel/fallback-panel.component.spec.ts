import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { ANY_URL_ROUTES } from 'src/app/testing/render-component';
import { FocusRecoveryService } from 'src/app/layout/page-template/focus-recovery.service';
import {
	FallbackPanelComponent,
	RETRY_FAILED_MESSAGE
} from './fallback-panel.component';

@Component({
	imports: [FallbackPanelComponent],
	template: `<app-fallback-panel
		heading="Couldn't load the news"
		[headingLevel]="headingLevel()"
		[actionLink]="actionLink()"
		[busy]="busy()"
		(action)="actions = actions + 1"
		>The server didn't answer.</app-fallback-panel
	>`
})
class HostComponent {
	public readonly headingLevel = signal<1 | 2>(2);
	public readonly actionLink = signal<string | undefined>(undefined);
	public readonly busy = signal(false);
	public actions = 0;
}

describe('FallbackPanelComponent', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [provideRouter(ANY_URL_ROUTES)]
		});
	});

	let attached: HTMLElement | undefined;
	afterEach(() => attached?.remove());

	function render(inputs: Partial<HostComponent> = {}) {
		const fixture = TestBed.createComponent(HostComponent);
		const host = fixture.componentInstance;
		host.headingLevel.set(inputs.headingLevel?.() ?? 2);
		host.actionLink.set(inputs.actionLink?.());
		host.busy.set(inputs.busy?.() ?? false);
		// Attached, so focus can move into it.
		attached = document.body.appendChild(fixture.nativeElement);
		fixture.detectChanges();
		const element: HTMLElement =
			fixture.nativeElement.querySelector('app-fallback-panel');
		return { fixture, host, element };
	}

	it('shows the graphic, an h2 heading and the projected message', () => {
		const { element } = render();

		expect(element.querySelector('svg')?.getAttribute('aria-hidden')).toBe(
			'true'
		);
		expect(element.querySelector('h2')?.textContent).toBe(
			"Couldn't load the news"
		);
		expect(element.querySelector('h1')).toBeNull();
		expect(element.querySelector('.message')?.textContent).toBe(
			"The server didn't answer."
		);
	});

	it('uses an h1 when it is the whole page', () => {
		const { element } = render({ headingLevel: signal(1) });

		expect(element.querySelector('h1')?.textContent).toBe(
			"Couldn't load the news"
		);
	});

	it('is announced and emits action when Try again is clicked', () => {
		const { fixture, host, element } = render();
		const button = element.querySelector('button')!;

		expect(element.querySelector('[role="alert"]')?.textContent).toContain(
			"Couldn't load the news"
		);
		expect(button.closest('[role]')).toBeNull();
		expect(button.textContent?.trim()).toBe('Try again');
		button.click();
		fixture.detectChanges();

		expect(host.actions).toBe(1);
	});

	it('ignores clicks while busy and says it is working', () => {
		const { host, element } = render({ busy: signal(true) });
		const button = element.querySelector('button')!;

		button.click();

		expect(host.actions).toBe(0);
		expect(button.getAttribute('aria-disabled')).toBe('true');
		expect(button.textContent?.trim()).toBe('Trying again…');
	});

	it('links to actionLink instead of emitting, without an alert role', async () => {
		const { fixture, element } = render({ actionLink: signal('/') });
		const link = element.querySelector('a')!;

		expect(element.querySelector('button')).toBeNull();
		expect(element.querySelector('[role]')).toBeNull();
		expect(link.getAttribute('href')).toBe('/');

		await TestBed.inject(Router).navigateByUrl('/elsewhere');
		link.click();
		await fixture.whenStable();

		expect(TestBed.inject(Router).url).toBe('/');
	});

	it('announces a failed retry once the button is ready again', () => {
		const announce = vi
			.spyOn(TestBed.inject(LiveAnnouncer), 'announce')
			.mockResolvedValue();
		const { fixture, host } = render();

		host.busy.set(true);
		fixture.detectChanges();
		expect(announce).not.toHaveBeenCalled();

		host.busy.set(false);
		fixture.detectChanges();

		expect(announce).toHaveBeenCalledWith(
			RETRY_FAILED_MESSAGE,
			'assertive'
		);
	});

	describe('focus', () => {
		let focusRecovery: FocusRecoveryService;

		beforeEach(() => {
			focusRecovery = TestBed.inject(FocusRecoveryService);
		});

		it('moves to the heading when focus was in the content it replaced', () => {
			vi.spyOn(focusRecovery, 'wasFocusLost').mockReturnValue(true);
			const { element } = render();

			expect(document.activeElement).toBe(element.querySelector('h2'));
		});

		it('stays put otherwise', () => {
			vi.spyOn(focusRecovery, 'wasFocusLost').mockReturnValue(false);
			render();

			expect(document.activeElement).toBe(document.body);
		});

		it('is recovered when the panel goes away', () => {
			const recover = vi
				.spyOn(focusRecovery, 'recoverAfterRender')
				.mockImplementation(() => undefined);
			const { fixture } = render();

			fixture.destroy();

			expect(recover).toHaveBeenCalled();
		});
	});
});
