import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Subject } from 'rxjs';
import { AuthSession } from 'src/app/core/auth/auth-session';
import { renderComponent } from 'src/app/testing/render-component';
import { AdminLoginPage, NAVIGATE_TO } from './admin-login-page';

const LOGIN_URL = 'http://api.test/auth/discord';

const logoutPending = vi.fn(() => false);
const finishLogout = vi.fn(() => new Subject<boolean>());
const navigateTo = vi.fn();

function renderPage(error?: string): ComponentFixture<AdminLoginPage> {
	TestBed.configureTestingModule({
		imports: [AdminLoginPage],
		providers: [
			{
				provide: AuthSession,
				useValue: {
					loginUrl: LOGIN_URL,
					isLogoutPending: logoutPending,
					finishLogout
				}
			},
			{ provide: NAVIGATE_TO, useValue: navigateTo },
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
	return renderComponent(AdminLoginPage);
}

const render = (error?: string): HTMLElement => renderPage(error).nativeElement;
const loginButton = (element: HTMLElement) =>
	element.querySelector<HTMLButtonElement>('button')!;

describe('AdminLoginPage', () => {
	beforeEach(() => {
		logoutPending.mockReturnValue(false);
		finishLogout.mockClear();
		navigateTo.mockClear();
	});

	it('has a Discord button, not a link that could skip the pending logout', () => {
		const element = render();
		expect(element.querySelector('h1')?.textContent).toBe(
			'Log in to The Rift admin'
		);
		expect(loginButton(element).textContent).toContain(
			'Continue with Discord'
		);
		expect(element.querySelector('a')).toBeNull();
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

	it('goes to Discord at once when no logout is pending', () => {
		loginButton(render()).click();

		expect(navigateTo).toHaveBeenCalledWith(LOGIN_URL);
		expect(finishLogout).not.toHaveBeenCalled();
	});

	describe('with a logout the API has not heard of', () => {
		beforeEach(() => logoutPending.mockReturnValue(true));

		it('sends the logout first, busy meanwhile, and goes to Discord once it is done', () => {
			const answer = new Subject<boolean>();
			finishLogout.mockReturnValueOnce(answer);
			const fixture = renderPage();
			const button = loginButton(fixture.nativeElement);

			button.click();
			button.click();
			fixture.detectChanges();

			expect(finishLogout).toHaveBeenCalledTimes(1);
			expect(navigateTo).not.toHaveBeenCalled();
			expect(button.getAttribute('aria-busy')).toBe('true');
			expect(button.getAttribute('aria-disabled')).toBe('true');

			answer.next(true);

			expect(navigateTo).toHaveBeenCalledOnce();
			expect(navigateTo).toHaveBeenCalledWith(LOGIN_URL);
		});

		it('stays and announces an error in a region that was already there', () => {
			const answer = new Subject<boolean>();
			finishLogout.mockReturnValueOnce(answer);
			const fixture = renderPage();
			const element: HTMLElement = fixture.nativeElement;
			const region = element.querySelector('[aria-live="polite"]');
			loginButton(element).click();

			answer.next(false);
			fixture.detectChanges();

			expect(navigateTo).not.toHaveBeenCalled();
			expect(element.querySelector('[aria-live="polite"]')).toBe(region);
			expect(region?.textContent).toContain("Couldn't reach The Rift");
			// Ready to try again.
			expect(loginButton(element).hasAttribute('aria-busy')).toBe(false);
		});
	});
});
