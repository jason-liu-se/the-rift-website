import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';

import { PageTemplateComponent } from './page-template.component';

@Component({ template: '<p class="stub-page">Stub page</p>' })
class StubPageComponent {}

describe('PageTemplateComponent', () => {
	let fixture: ComponentFixture<PageTemplateComponent>;
	let element: HTMLElement;
	let routeData: Record<string, unknown>;

	beforeEach(() => {
		routeData = { component: StubPageComponent };
		TestBed.configureTestingModule({
			imports: [PageTemplateComponent],
			providers: [
				provideRouter([]),
				{
					provide: ActivatedRoute,
					useFactory: () => ({ snapshot: { data: routeData } })
				}
			]
		});
	});

	function render(data: Record<string, unknown> = {}): void {
		Object.assign(routeData, data);
		fixture = TestBed.createComponent(PageTemplateComponent);
		element = fixture.nativeElement;
		// Attached so the <main> element can receive focus.
		document.body.appendChild(element);
		fixture.detectChanges();
		// Runs afterNextRender hooks, which detectChanges() alone doesn't.
		TestBed.tick();
	}

	const mainContent = (): HTMLElement => element.querySelector('main')!;
	const navbarWrapper = () => element.querySelector('.rift-navbar-wrapper');

	afterEach(() => element.remove());

	it("renders the route's page inside <main>", () => {
		render();

		expect(mainContent().querySelector('.stub-page')).not.toBeNull();
	});

	it('shows a transparent navbar and the footer, without the contact section, by default', () => {
		render();

		expect(navbarWrapper()?.classList).not.toContain('opaque');
		expect(element.querySelector('app-footer')).not.toBeNull();
		expect(element.querySelector('app-contact')).toBeNull();
	});

	it('shows an opaque navbar when isTransparent is false', () => {
		render({ isTransparent: false });

		expect(navbarWrapper()?.classList).toContain('opaque');
	});

	it('shows the contact section when showContactSection is true', () => {
		render({ showContactSection: true });

		expect(element.querySelector('app-contact')).not.toBeNull();
	});

	it('hides the footer when showFooter is false', () => {
		render({ showFooter: false });

		expect(element.querySelector('app-footer')).toBeNull();
	});

	it('leaves focus alone on the first page load', () => {
		render();

		expect(document.activeElement).not.toBe(mainContent());
	});

	it('focuses the main content after an in-app navigation', () => {
		TestBed.inject(Router).navigated = true;

		render();

		expect(document.activeElement).toBe(mainContent());
	});
});
