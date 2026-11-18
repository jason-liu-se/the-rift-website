import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { ANY_URL_ROUTES } from 'src/app/testing/render-component';
import { AdminPageComponent } from './admin-page.component';

describe('AdminPageComponent', () => {
	const logout = vi.fn(() => of<void>(undefined));
	let harness: RouterTestingHarness;

	async function open(url: string): Promise<HTMLElement> {
		TestBed.configureTestingModule({
			providers: [
				provideRouter([
					{ path: 'admin', component: AdminPageComponent },
					...ANY_URL_ROUTES
				]),
				{
					provide: AuthService,
					useValue: {
						logout,
						getMe: () => of({ id: '1', username: 'editor' })
					}
				}
			]
		});
		harness = await RouterTestingHarness.create();
		await harness.navigateByUrl(url);
		return harness.routeNativeElement!;
	}

	const clickLogout = (element: HTMLElement) =>
		[...element.querySelectorAll('button')]
			.find((button) => button.textContent?.includes('Log out'))!
			.click();

	const currentLink = (element: HTMLElement) =>
		element.querySelector('nav [aria-current="page"]')?.textContent;

	const title = (element: HTMLElement) =>
		element.querySelector('h1')?.textContent;

	it('opens the news tool by default', async () => {
		const element = await open('/admin');
		expect(currentLink(element)).toContain('News');
		expect(title(element)).toBe('News');
		expect(element.querySelector('app-news-tool')).not.toBeNull();
	});

	it('opens the tool named by the URL fragment', async () => {
		const element = await open('/admin#gallery');
		expect(currentLink(element)).toContain('Gallery');
		expect(title(element)).toBe('Gallery');
		expect(element.querySelectorAll('nav [aria-current]')).toHaveLength(1);
		expect(element.querySelector('app-gallery-tool')).not.toBeNull();
		expect(element.querySelector('app-news-tool')).toBeNull();
	});

	it('falls back to the news tool for an unknown fragment', async () => {
		const element = await open('/admin#nope');
		expect(currentLink(element)).toContain('News');
		expect(element.querySelector('app-news-tool')).not.toBeNull();
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

		expect(TestBed.inject(Router).url).toBe('/admin#downloads');
		expect(element.querySelector('app-downloads-tool')).not.toBeNull();
		expect(title(element)).toBe('Downloads');
	});

	it('shows the logged-in editor in the top bar', async () => {
		const element = await open('/admin');
		expect(
			element.querySelector('header app-admin-user')?.textContent
		).toContain('editor');
	});

	it('logs out and goes to the login page', async () => {
		const element = await open('/admin');
		clickLogout(element);
		await harness.fixture.whenStable();

		expect(logout).toHaveBeenCalled();
		expect(TestBed.inject(Router).url).toBe('/admin/login');
	});

	it('stays and says so when logging out fails', async () => {
		logout.mockReturnValueOnce(throwError(() => new Error('offline')));
		const element = await open('/admin');
		clickLogout(element);
		await harness.fixture.whenStable();
		harness.detectChanges();

		expect(TestBed.inject(Router).url).toBe('/admin');
		expect(element.querySelector('[role="alert"]')?.textContent).toContain(
			"Couldn't log out"
		);
	});
});
