import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

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
		fixture = TestBed.createComponent(PageTemplateComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
