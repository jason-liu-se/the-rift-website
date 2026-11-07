import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackgroundImageCardComponent } from './background-image-card.component';

describe('BackgroundImageCardComponent', () => {
	let component: BackgroundImageCardComponent;
	let fixture: ComponentFixture<BackgroundImageCardComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [BackgroundImageCardComponent]
		});
		fixture = TestBed.createComponent(BackgroundImageCardComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
