import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { SessionUser } from 'src/app/interfaces/api-responses';
import { AuthService } from 'src/app/services/auth/auth.service';
import { renderComponent } from 'src/app/testing/render-component';
import { AdminUserComponent } from './admin-user.component';

const AVATAR_URL = 'https://cdn.discordapp.test/avatars/1/a.png';

function render(me: Observable<SessionUser>) {
	TestBed.configureTestingModule({
		imports: [AdminUserComponent],
		providers: [{ provide: AuthService, useValue: { getMe: () => me } }]
	});
	return renderComponent(AdminUserComponent);
}

describe('AdminUserComponent', () => {
	it('shows the editor’s avatar and username', () => {
		const element: HTMLElement = render(
			of({ id: '1', username: 'steve', avatarUrl: AVATAR_URL })
		).nativeElement;

		expect(element.querySelector('img')?.getAttribute('src')).toBe(
			AVATAR_URL
		);
		const username = element.querySelector('.username');
		expect(username?.textContent?.trim()).toBe('Signed in as steve');
		expect(username?.getAttribute('title')).toBe('steve');
	});

	it('shows the editor’s initial without an avatar', () => {
		const element: HTMLElement = render(
			of({ id: '1', username: 'steve' })
		).nativeElement;

		expect(element.querySelector('img')).toBeNull();
		expect(element.querySelector('.avatar')?.textContent?.trim()).toBe('S');
	});

	it('swaps a broken avatar for the initial', () => {
		const fixture = render(
			of({ id: '1', username: 'alex', avatarUrl: AVATAR_URL })
		);
		const element: HTMLElement = fixture.nativeElement;

		element.querySelector('img')!.dispatchEvent(new Event('error'));
		fixture.detectChanges();

		expect(element.querySelector('img')).toBeNull();
		expect(element.querySelector('.avatar')?.textContent?.trim()).toBe('A');
	});

	it('shows a generic icon and no name when the user can’t be loaded', () => {
		const element: HTMLElement = render(
			throwError(() => new Error('401'))
		).nativeElement;

		expect(element.querySelector('img')).toBeNull();
		expect(element.querySelector('mat-icon')?.textContent).toBe('person');
		expect(element.querySelector('.username')).toBeNull();
	});
});
