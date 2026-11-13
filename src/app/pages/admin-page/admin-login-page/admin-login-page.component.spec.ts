import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { renderComponent } from 'src/app/testing/render-component';
import { AdminLoginPageComponent } from './admin-login-page.component';

const LOGIN_URL = 'http://api.test/auth/discord';

function render(error?: string): HTMLElement {
	TestBed.configureTestingModule({
		imports: [AdminLoginPageComponent],
		providers: [
			{ provide: AuthService, useValue: { loginUrl: LOGIN_URL } },
			{
				provide: ActivatedRoute,
				useValue: {
					snapshot: {
						queryParamMap: convertToParamMap(error ? { error } : {})
					}
				}
			}
		]
	});
	return renderComponent(AdminLoginPageComponent).nativeElement;
}

describe('AdminLoginPageComponent', () => {
	it('links to the Discord login', () => {
		const link = render().querySelector('a');
		expect(link?.textContent).toContain('Log in with Discord');
		expect(link?.getAttribute('href')).toBe(LOGIN_URL);
	});

	it('shows no error without an error code', () => {
		expect(render().querySelector('[role="alert"]')).toBeNull();
	});

	it('explains a known error code', () => {
		expect(
			render('not-authorized').querySelector('[role="alert"]')
				?.textContent
		).toContain("doesn't have admin access");
	});

	it('falls back to a generic message for an unknown code', () => {
		expect(
			render('toString').querySelector('[role="alert"]')?.textContent
		).toContain('Login failed');
	});
});
