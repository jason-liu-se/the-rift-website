import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WelcomeCardComponent } from './welcome-card.component';

describe('WelcomeCardComponent', () => {
	let component: WelcomeCardComponent;
	let fixture: ComponentFixture<WelcomeCardComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [WelcomeCardComponent],
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter([]),
				provideNoopAnimations()
			]
		});
		fixture = TestBed.createComponent(WelcomeCardComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
