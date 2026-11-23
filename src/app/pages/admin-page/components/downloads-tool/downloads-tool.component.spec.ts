import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { renderComponent } from 'src/app/testing/render-component';
import { DownloadsToolComponent } from './downloads-tool.component';

describe('DownloadsToolComponent', () => {
	it('previews a sample download with the downloads page card', () => {
		TestBed.configureTestingModule({
			imports: [DownloadsToolComponent],
			providers: [provideHttpClient(), provideHttpClientTesting()]
		});
		const fixture = renderComponent(DownloadsToolComponent);
		const { preview } = fixture.componentInstance;
		const card: HTMLElement =
			fixture.nativeElement.querySelector('app-download-card');
		expect(card.querySelector('.title')?.textContent).toBe(preview.title);
		expect(card.querySelector('a')?.getAttribute('href')).toBe(
			preview.downloadUrl
		);
		// Sample data can't be tabbed into or used.
		expect(card.closest('[inert]')).not.toBeNull();
	});
});
