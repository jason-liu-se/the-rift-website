import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { ANY_URL_ROUTES } from 'src/app/testing/render-component';
import { ErrorStateComponent } from './error-state.component';

@Component({
	imports: [ErrorStateComponent],
	template: `<app-error-state
		heading="Couldn't load the news"
		[headingLevel]="headingLevel()"
		[actionLink]="actionLink()"
		[busy]="busy()"
		(action)="actions = actions + 1"
		>The server didn't answer.</app-error-state
	>`
})
class HostComponent {
	public readonly headingLevel = signal<1 | 2>(2);
	public readonly actionLink = signal<string | undefined>(undefined);
	public readonly busy = signal(false);
	public actions = 0;
}

describe('ErrorStateComponent', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [provideRouter(ANY_URL_ROUTES)]
		});
	});

	function render(inputs: Partial<HostComponent> = {}) {
		const fixture = TestBed.createComponent(HostComponent);
		const host = fixture.componentInstance;
		host.headingLevel.set(inputs.headingLevel?.() ?? 2);
		host.actionLink.set(inputs.actionLink?.());
		host.busy.set(inputs.busy?.() ?? false);
		fixture.detectChanges();
		const element: HTMLElement =
			fixture.nativeElement.querySelector('app-error-state');
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

		expect(element.getAttribute('role')).toBe('alert');
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
		expect(element.hasAttribute('role')).toBe(false);
		expect(link.getAttribute('href')).toBe('/');

		await TestBed.inject(Router).navigateByUrl('/elsewhere');
		link.click();
		await fixture.whenStable();

		expect(TestBed.inject(Router).url).toBe('/');
	});
});
