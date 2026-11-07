import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageShowcaseSectionComponent } from './image-showcase-section.component';

describe('ImageShowcaseSectionComponent', () => {
	let component: ImageShowcaseSectionComponent;
	let fixture: ComponentFixture<ImageShowcaseSectionComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [ImageShowcaseSectionComponent]
		});
		fixture = TestBed.createComponent(ImageShowcaseSectionComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
