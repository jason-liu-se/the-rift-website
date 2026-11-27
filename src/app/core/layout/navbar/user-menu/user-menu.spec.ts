import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UserLogout } from 'src/app/core/auth/user-logout';
import { AuthSession } from 'src/app/core/auth/auth-session';
import { UserMenu } from './user-menu';

describe('UserMenu', () => {
	const logout = vi.fn();
	let fixture: ComponentFixture<UserMenu>;
	let element: HTMLElement;
	const mobile = () => element.querySelector('.mobile')!;

	beforeEach(() => {
		logout.mockClear();
		TestBed.configureTestingModule({
			providers: [
				provideRouter([]),
				{
					provide: AuthSession,
					useValue: { user: signal({ id: '1', username: 'editor' }) }
				},
				{ provide: UserLogout, useValue: { logout } }
			]
		});
		fixture = TestBed.createComponent(UserMenu);
		fixture.detectChanges();
		element = fixture.nativeElement;
	});

	it('lists the user, Admin and Log out for the hamburger menu', () => {
		expect(mobile().textContent).toContain('editor');
		expect(mobile().querySelector('a')?.getAttribute('href')).toBe(
			'/admin'
		);
		expect(mobile().querySelector('button')?.textContent).toContain(
			'Log out'
		);
	});

	it('logs out from the hamburger menu and tells the navbar', () => {
		const loggedOut = vi.fn();
		fixture.componentInstance.loggedOut.subscribe(loggedOut);

		mobile().querySelector('button')!.click();

		expect(logout).toHaveBeenCalledTimes(1);
		expect(loggedOut).toHaveBeenCalled();
	});
});
