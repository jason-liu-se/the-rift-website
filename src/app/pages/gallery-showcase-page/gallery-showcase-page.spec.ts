import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GalleryShowcasePageComponent } from './gallery-showcase-page.component';

describe('GalleryShowcasePageComponent', () => {
	let component: GalleryShowcasePageComponent;
	let fixture: ComponentFixture<GalleryShowcasePageComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [GalleryShowcasePageComponent],
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter([]),
				provideNoopAnimations()
			]
		});
		fixture = TestBed.createComponent(GalleryShowcasePageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
