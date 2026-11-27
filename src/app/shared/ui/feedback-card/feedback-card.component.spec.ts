import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { FeedbackCardComponent } from './feedback-card.component';
import { FeedbackVariant } from './feedback-variant';

@Component({
	imports: [FeedbackCardComponent],
	template: `<app-feedback-card
		title="Couldn't save"
		[variant]="variant()"
		[icon]="icon()"
		>Check your connection.</app-feedback-card
	>`
})
class HostComponent {
	public readonly variant = signal<FeedbackVariant>('error');
	public readonly icon = signal<string | undefined>(undefined);
}

describe('FeedbackCardComponent', () => {
	function render(
		variant: FeedbackVariant = 'error',
		icon?: string
	): HTMLElement {
		const fixture = TestBed.createComponent(HostComponent);
		fixture.componentInstance.variant.set(variant);
		fixture.componentInstance.icon.set(icon);
		fixture.detectChanges();
		return fixture.nativeElement.querySelector('app-feedback-card');
	}

	it('shows the title and the projected message', () => {
		const card = render();

		expect(card.querySelector('.title')?.textContent).toBe("Couldn't save");
		expect(card.querySelector('.message')?.textContent).toBe(
			'Check your connection.'
		);
		expect(card.hasAttribute('title')).toBe(false);
	});

	it.each<{ variant: FeedbackVariant; role: string }>([
		{ variant: 'error', role: 'alert' },
		{ variant: 'warning', role: 'alert' },
		{ variant: 'success', role: 'status' }
	])('is a $role styled as $variant', ({ variant, role }) => {
		const card = render(variant);

		expect(card.getAttribute('role')).toBe(role);
		expect(card.classList).toContain(variant);
	});

	it('defaults to the error variant', () => {
		TestBed.configureTestingModule({});
		const fixture = TestBed.createComponent(FeedbackCardComponent);
		fixture.componentRef.setInput('title', 'Failed');
		fixture.detectChanges();

		expect(fixture.nativeElement.classList).toContain('error');
	});

	it('can be focused by script but is not a Tab stop', () => {
		const card = render();
		document.body.appendChild(card);

		card.focus();

		expect(document.activeElement).toBe(card);
		expect(card.getAttribute('tabindex')).toBe('-1');
		card.remove();
	});

	it('shows the icon only when one is given', () => {
		expect(render().querySelector('.material-icons')).toBeNull();
		expect(
			render('error', 'wifi_off').querySelector('.material-icons')
				?.textContent
		).toBe('wifi_off');
	});
});
