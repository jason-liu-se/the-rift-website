import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ErrorPageComponent } from './error-page.component';

describe('ErrorPageComponent', () => {
	let component: ErrorPageComponent;
	let fixture: ComponentFixture<ErrorPageComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [ErrorPageComponent],
			providers: [provideRouter([])]
		});
		fixture = TestBed.createComponent(ErrorPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
