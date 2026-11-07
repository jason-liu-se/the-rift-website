import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlueMapPageComponent } from './blue-map-page.component';

describe('BlueMapPageComponent', () => {
	let component: BlueMapPageComponent;
	let fixture: ComponentFixture<BlueMapPageComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [BlueMapPageComponent],
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter([]),
				provideNoopAnimations()
			]
		});
		fixture = TestBed.createComponent(BlueMapPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
