import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactPageComponent } from './contact-page.component';

describe('ContactPageComponent', () => {
	let component: ContactPageComponent;
	let fixture: ComponentFixture<ContactPageComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [ContactPageComponent],
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter([])
			]
		});
		fixture = TestBed.createComponent(ContactPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
