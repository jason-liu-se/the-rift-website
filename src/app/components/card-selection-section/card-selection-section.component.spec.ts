import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardSelectionSectionComponent } from './card-selection-section.component';

describe('CollectionCardComponent', () => {
	let component: CardSelectionSectionComponent;
	let fixture: ComponentFixture<CardSelectionSectionComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [CardSelectionSectionComponent]
		});
		fixture = TestBed.createComponent(CardSelectionSectionComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
