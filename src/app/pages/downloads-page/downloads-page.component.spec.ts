import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadsPageComponent } from './downloads-page.component';

describe('DownloadsPageComponent', () => {
	let component: DownloadsPageComponent;
	let fixture: ComponentFixture<DownloadsPageComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [DownloadsPageComponent],
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter([]),
				provideNoopAnimations()
			]
		});
		fixture = TestBed.createComponent(DownloadsPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
