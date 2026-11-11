import { ApplicationRef, Component, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
	CHUNK_RELOAD_KEY,
	PageTemplateComponent
} from './page-template.component';

@Component({ template: '<p class="stub-page">Stub page</p>' })
class StubPageComponent {}

describe('PageTemplateComponent', () => {
	let fixture: ComponentFixture<PageTemplateComponent>;
	let element: HTMLElement;
	let routeData: Record<string, unknown>;

	beforeEach(() => {
		routeData = { loadComponent: () => Promise.resolve(StubPageComponent) };
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

	async function render(data: Record<string, unknown> = {}): Promise<void> {
		Object.assign(routeData, data);
		fixture = TestBed.createComponent(PageTemplateComponent);
		element = fixture.nativeElement;
		// Attached so the <main> element can receive focus.
		document.body.appendChild(element);
		fixture.detectChanges();
		// Waits for the page component to load, then runs afterNextRender hooks.
		await fixture.whenStable();
		TestBed.tick();
	}

	const mainContent = (): HTMLElement => element.querySelector('main')!;
	const navbarWrapper = () => element.querySelector('.rift-navbar-wrapper');

	afterEach(() => {
		element.remove();
		sessionStorage.clear();
	});

	it("renders the route's page inside <main>", async () => {
		await render();

		expect(mainContent().querySelector('.stub-page')).not.toBeNull();
	});

	it('shows a transparent navbar and the footer, without the contact section, by default', async () => {
		await render();

		expect(navbarWrapper()?.classList).not.toContain('opaque');
		expect(element.querySelector('app-footer')).not.toBeNull();
		expect(element.querySelector('app-contact')).toBeNull();
	});

	it('shows an opaque navbar when isTransparent is false', async () => {
		await render({ isTransparent: false });

		expect(navbarWrapper()?.classList).toContain('opaque');
	});

	it('shows the contact section when showContactSection is true', async () => {
		await render({ showContactSection: true });

		expect(element.querySelector('app-contact')).not.toBeNull();
	});

	it('hides the footer when showFooter is false', async () => {
		await render({ showFooter: false });

		expect(element.querySelector('app-footer')).toBeNull();
	});

	it('leaves focus alone on the first page load', async () => {
		await render();

		expect(document.activeElement).not.toBe(mainContent());
	});

	it('focuses the main content after an in-app navigation', async () => {
		TestBed.inject(Router).navigated = true;

		await render();

		expect(document.activeElement).toBe(mainContent());
	});

	describe('loading the page', () => {
		const isStable = () =>
			firstValueFrom(TestBed.inject(ApplicationRef).isStable);
		const failedLoad = () => Promise.reject(new Error('chunk missing'));

		it('keeps the app unstable until the page has loaded', async () => {
			let resolvePage!: (page: Type<unknown>) => void;
			routeData['loadComponent'] = () =>
				new Promise<Type<unknown>>(
					(resolve) => (resolvePage = resolve)
				);
			fixture = TestBed.createComponent(PageTemplateComponent);
			element = fixture.nativeElement;
			fixture.detectChanges();

			expect(await isStable()).toBe(false);

			resolvePage(StubPageComponent);
			await fixture.whenStable();

			expect(await isStable()).toBe(true);
			expect(mainContent().querySelector('.stub-page')).not.toBeNull();
		});

		it('reloads once when the page fails to load', async () => {
			// jsdom can't navigate or spy on location.reload(), so this checks the
			// marker set just before reloading and that nothing was rendered.
			await render({ loadComponent: failedLoad });

			expect(sessionStorage.getItem(CHUNK_RELOAD_KEY)).toBe('true');
			expect(mainContent().children).toHaveLength(0);
		});

		it('fails without reloading again when the reload did not help', async () => {
			sessionStorage.setItem(CHUNK_RELOAD_KEY, 'true');
			fixture = TestBed.createComponent(PageTemplateComponent);
			element = fixture.nativeElement;
			routeData['loadComponent'] = failedLoad;

			await expect(fixture.componentInstance.ngOnInit()).rejects.toThrow(
				'chunk missing'
			);
		});

		it('clears the reload marker once a page loads', async () => {
			sessionStorage.setItem(CHUNK_RELOAD_KEY, 'true');

			await render();

			expect(sessionStorage.getItem(CHUNK_RELOAD_KEY)).toBeNull();
		});
	});
});
