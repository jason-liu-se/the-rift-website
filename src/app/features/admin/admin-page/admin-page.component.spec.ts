import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import {
	Router,
	provideRouter,
	withComponentInputBinding
} from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ANY_URL_ROUTES } from 'src/app/testing/render-component';
import { ADMIN_THEME_HREF, AdminPageComponent } from './admin-page.component';
import ADMIN_ROUTES from '../admin.routes';

describe('AdminPageComponent', () => {
	let harness: RouterTestingHarness;

	async function open(url: string): Promise<HTMLElement> {
		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideRouter(
					[
						{
							path: 'admin',
							component: AdminPageComponent,
							children: ADMIN_ROUTES
						},
						...ANY_URL_ROUTES
					],
					withComponentInputBinding()
				)
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
	const url = () => TestBed.inject(Router).url;

	it('loads the admin theme once', async () => {
		await open('/admin/news');
		await harness.navigateByUrl('/admin/gallery');

		const links = document.querySelectorAll('link#admin-theme');
		expect(links).toHaveLength(1);
		expect(links[0].getAttribute('href')).toBe(ADMIN_THEME_HREF);
	});

	it('opens the news tool by default', async () => {
		const element = await open('/admin');

		expect(url()).toBe('/admin/news');
		expect(currentLink(element)).toContain('News');
		expect(heading(element)).toBe('News – Admin');
		expect(TestBed.inject(Title).getTitle()).toBe('News · Admin');
	});

	it("doesn't open a tool that isn't a content type", async () => {
		await open('/admin/nope');

		expect(url()).toBe('/admin/nope');
		expect(document.querySelector('h1')).toBeNull();
	});

	it('moves focus to the heading when switching tools, not on first load', async () => {
		const element = await open('/admin/news');
		await harness.fixture.whenStable();
		expect(document.activeElement).not.toBe(element.querySelector('h1'));

		[...element.querySelectorAll<HTMLAnchorElement>('nav a')]
			.find((link) => link.textContent?.includes('Downloads'))!
			.click();
		await harness.fixture.whenStable();
		harness.detectChanges();
		await harness.fixture.whenStable();

		expect(url()).toBe('/admin/downloads');
		expect(heading(element)).toBe('Downloads – Admin');
		expect(document.activeElement).toBe(element.querySelector('h1'));
	});
});
