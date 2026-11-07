import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageSlideshowComponent } from './image-slideshow.component';

describe('ImageSlideshowComponent', () => {
	let component: ImageSlideshowComponent;
	let fixture: ComponentFixture<ImageSlideshowComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [ImageSlideshowComponent],
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter([]),
				provideNoopAnimations()
			]
		});
		fixture = TestBed.createComponent(ImageSlideshowComponent);
		component = fixture.componentInstance;
		fixture.componentRef.setInput('captionedImages', []);
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
