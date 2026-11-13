import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { ANY_URL_ROUTES } from 'src/app/testing/render-component';
import { AdminPageComponent } from './admin-page.component';

describe('AdminPageComponent', () => {
	const logout = vi.fn(() => of(undefined));
	let harness: RouterTestingHarness;

	async function open(url: string): Promise<HTMLElement> {
		TestBed.configureTestingModule({
			providers: [
				provideRouter([
					{ path: 'admin', component: AdminPageComponent },
					...ANY_URL_ROUTES
				]),
				{ provide: AuthService, useValue: { logout } }
			]
		});
		harness = await RouterTestingHarness.create();
		await harness.navigateByUrl(url);
		return harness.routeNativeElement!;
	}

	const activeTab = (element: HTMLElement) =>
		element.querySelector('[mat-tab-link].mdc-tab--active')?.textContent;

	it('opens the news tool by default', async () => {
		const element = await open('/admin');
		expect(activeTab(element)).toContain('News');
		expect(element.querySelector('app-news-tool')).not.toBeNull();
	});

	it('opens the tool named by the URL fragment', async () => {
		const element = await open('/admin#gallery');
		expect(activeTab(element)).toContain('Gallery');
		expect(element.querySelector('app-gallery-tool')).not.toBeNull();
		expect(element.querySelector('app-news-tool')).toBeNull();
	});

	it('falls back to the news tool for an unknown fragment', async () => {
		const element = await open('/admin#nope');
		expect(element.querySelector('app-news-tool')).not.toBeNull();
	});

	it('switches tools by changing the URL fragment', async () => {
		const element = await open('/admin');
		const downloadsTab = [
			...element.querySelectorAll<HTMLAnchorElement>('[mat-tab-link]')
		].find((tab) => tab.textContent?.includes('Downloads'))!;

		downloadsTab.click();
		await harness.fixture.whenStable();
		harness.detectChanges();

		expect(TestBed.inject(Router).url).toBe('/admin#downloads');
		expect(element.querySelector('app-downloads-tool')).not.toBeNull();
	});

	it('logs out and goes to the login page', async () => {
		const element = await open('/admin');
		[...element.querySelectorAll('button')]
			.find((button) => button.textContent?.includes('Log out'))!
			.click();
		await harness.fixture.whenStable();

		expect(logout).toHaveBeenCalled();
		expect(TestBed.inject(Router).url).toBe('/admin/login');
	});
});
