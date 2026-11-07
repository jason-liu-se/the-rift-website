import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinPageComponent } from './join-page.component';

describe('JoinPageComponent', () => {
	let component: JoinPageComponent;
	let fixture: ComponentFixture<JoinPageComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [JoinPageComponent],
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter([]),
				provideNoopAnimations()
			]
		});
		fixture = TestBed.createComponent(JoinPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
