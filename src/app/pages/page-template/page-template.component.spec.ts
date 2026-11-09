import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';

import { PageTemplateComponent } from './page-template.component';
import { ErrorPageComponent } from '../error-page/error-page.component';

describe('PageTemplateComponent', () => {
	let component: PageTemplateComponent;
	let fixture: ComponentFixture<PageTemplateComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [PageTemplateComponent],
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter([]),
				provideNoopAnimations(),
				{
					provide: ActivatedRoute,
					useValue: {
						snapshot: { data: { component: ErrorPageComponent } }
					}
				}
			]
		});
	});

	function render(): void {
		fixture = TestBed.createComponent(PageTemplateComponent);
		component = fixture.componentInstance;
		// Attached so the <main> element can receive focus.
		document.body.appendChild(fixture.nativeElement);
		fixture.detectChanges();
		// Runs afterNextRender hooks, which detectChanges() alone doesn't.
		TestBed.tick();
	}

	const mainContent = (): HTMLElement =>
		fixture.nativeElement.querySelector('main');

	afterEach(() => fixture.nativeElement.remove());

	it('should create', () => {
		render();
		expect(component).toBeTruthy();
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
