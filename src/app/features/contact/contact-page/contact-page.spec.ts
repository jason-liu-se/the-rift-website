import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactPage } from './contact-page';

describe('ContactPage', () => {
	let component: ContactPage;
	let fixture: ComponentFixture<ContactPage>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [ContactPage],
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter([])
			]
		});
		fixture = TestBed.createComponent(ContactPage);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
