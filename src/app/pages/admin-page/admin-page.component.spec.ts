import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ANY_URL_ROUTES } from 'src/app/testing/render-component';
import { ADMIN_THEME_HREF, AdminPageComponent } from './admin-page.component';

describe('AdminPageComponent', () => {
	let harness: RouterTestingHarness;

	async function open(url: string): Promise<HTMLElement> {
		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter([
					{ path: 'admin', component: AdminPageComponent },
					...ANY_URL_ROUTES
				])
			]
		});
		harness = await RouterTestingHarness.create();
		await harness.navigateByUrl(url);
		return harness.routeNativeElement!;
	}

	const currentLink = (element: HTMLElement) =>
		element.querySelector('nav [aria-current="page"]')?.textContent;

	const heading = (element: HTMLElement) =>
		element.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim();

	const documentTitle = () => TestBed.inject(Title).getTitle();

	it('loads the admin theme once', async () => {
		await open('/admin');
		await harness.navigateByUrl('/admin#gallery');

		const links = document.querySelectorAll('link#admin-theme');
		expect(links).toHaveLength(1);
		expect(links[0].getAttribute('href')).toBe(ADMIN_THEME_HREF);
	});

	it('opens the news tool by default', async () => {
		const element = await open('/admin');
		expect(currentLink(element)).toContain('News');
		expect(heading(element)).toBe('News – Admin');
		expect(documentTitle()).toBe('News · Admin | The Rift');
		expect(element.querySelector('app-news-tool')).not.toBeNull();
	});

	it('opens the tool named by the URL fragment', async () => {
		const element = await open('/admin#gallery');
		expect(currentLink(element)).toContain('Gallery');
		expect(heading(element)).toBe('Gallery – Admin');
		expect(element.querySelectorAll('nav [aria-current]')).toHaveLength(1);
		expect(element.querySelector('app-gallery-tool')).not.toBeNull();
		expect(element.querySelector('app-news-tool')).toBeNull();
	});

	it('falls back to the news tool for an unknown fragment', async () => {
		const element = await open('/admin#nope');
		expect(currentLink(element)).toContain('News');
		expect(element.querySelector('app-news-tool')).not.toBeNull();
	});

	it('leaves focus alone on first load', async () => {
		const element = await open('/admin');
		await harness.fixture.whenStable();
		expect(document.activeElement).not.toBe(element.querySelector('h1'));
	});

	it('switches tools by changing the URL fragment', async () => {
		const element = await open('/admin');
		const downloadsLink = [
			...element.querySelectorAll<HTMLAnchorElement>('nav a')
		].find((link) => link.textContent?.includes('Downloads'))!;
		expect(downloadsLink.getAttribute('href')).toBe('/admin#downloads');

		downloadsLink.click();
		await harness.fixture.whenStable();
		harness.detectChanges();
		// The tool's list renders (and focus moves) after its first request.
		await new Promise((resolve) => setTimeout(resolve));

		expect(TestBed.inject(Router).url).toBe('/admin#downloads');
		expect(element.querySelector('app-downloads-tool')).not.toBeNull();
		expect(heading(element)).toBe('Downloads – Admin');
		expect(documentTitle()).toBe('Downloads · Admin | The Rift');
		// Announces the switch by moving focus to the new heading.
		expect(document.activeElement).toBe(element.querySelector('h1'));
	});
});
