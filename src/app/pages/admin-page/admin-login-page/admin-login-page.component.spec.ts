import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Subject } from 'rxjs';
import { AuthService } from 'src/app/services/auth/auth.service';
import { renderComponent } from 'src/app/testing/render-component';
import { AdminLoginPageComponent } from './admin-login-page.component';

const LOGIN_URL = 'http://api.test/auth/discord';

const logoutPending = vi.fn(() => false);
const finishLogout = vi.fn(() => new Subject<boolean>());

function renderPage(error?: string): ComponentFixture<AdminLoginPageComponent> {
	TestBed.configureTestingModule({
		imports: [AdminLoginPageComponent],
		providers: [
			{
				provide: AuthService,
				useValue: {
					loginUrl: LOGIN_URL,
					isLogoutPending: logoutPending,
					finishLogout
				}
			},
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
	return renderComponent(AdminLoginPageComponent);
}

const render = (error?: string): HTMLElement => renderPage(error).nativeElement;

describe('AdminLoginPageComponent', () => {
	it('links to the Discord login', () => {
		const element = render();
		const link = element.querySelector('a');
		expect(element.querySelector('h1')?.textContent).toBe(
			'Log in to The Rift admin'
		);
		expect(link?.textContent).toContain('Continue with Discord');
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

	describe('with a logout the API has not heard of', () => {
		/** Clicks the Discord link; returns whether the browser would follow it. */
		function click(element: HTMLElement): { followed: boolean[] } {
			const result: { followed: boolean[] } = { followed: [] };
			element.addEventListener('click', (event) =>
				result.followed.push(!event.defaultPrevented)
			);
			element.querySelector('a')!.click();
			return result;
		}

		beforeEach(() => {
			logoutPending.mockReturnValue(true);
			finishLogout.mockClear();
		});
		afterEach(() => logoutPending.mockReturnValue(false));

		it('goes to Discord straight away when nothing is pending', () => {
			logoutPending.mockReturnValue(false);

			expect(click(render()).followed).toEqual([true]);
			expect(finishLogout).not.toHaveBeenCalled();
		});

		it('sends the logout first and goes to Discord once it is done', () => {
			const answer = new Subject<boolean>();
			finishLogout.mockReturnValueOnce(answer);
			const element = render();

			const result = click(element);
			expect(result.followed).toEqual([false]);

			logoutPending.mockReturnValue(false);
			answer.next(true);
			expect(result.followed).toEqual([false, true]);
		});

		it('stays and shows an error when the logout fails', () => {
			const answer = new Subject<boolean>();
			finishLogout.mockReturnValueOnce(answer);
			const fixture = renderPage();
			const result = click(fixture.nativeElement);

			answer.next(false);
			fixture.detectChanges();

			expect(result.followed).toEqual([false]);
			expect(
				fixture.nativeElement.querySelector('[role="alert"]')
					?.textContent
			).toContain("Couldn't reach The Rift");
		});
	});
});
