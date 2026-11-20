import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SessionUser } from 'src/app/interfaces/api-responses';
import { AuthService } from 'src/app/services/auth/auth.service';
import { renderComponent } from 'src/app/testing/render-component';
import { UserAvatarComponent } from './user-avatar.component';

const AVATAR_URL = 'https://cdn.discordapp.test/avatars/1/a.png';

function render(user: SessionUser | null) {
	TestBed.configureTestingModule({
		imports: [UserAvatarComponent],
		providers: [{ provide: AuthService, useValue: { user: signal(user) } }]
	});
	return renderComponent(UserAvatarComponent);
}

describe('UserAvatarComponent', () => {
	it('shows the editor’s avatar and username', () => {
		const element: HTMLElement = render({
			id: '1',
			username: 'steve',
			avatarUrl: AVATAR_URL
		}).nativeElement;

		expect(element.querySelector('img')?.getAttribute('src')).toBe(
			AVATAR_URL
		);
		const username = element.querySelector('.username');
		expect(username?.textContent?.trim()).toBe('Signed in as steve');
		expect(username?.getAttribute('title')).toBe('steve');
	});

	it('shows the editor’s initial without an avatar', () => {
		const element: HTMLElement = render({
			id: '1',
			username: 'steve'
		}).nativeElement;

		expect(element.querySelector('img')).toBeNull();
		expect(element.querySelector('.avatar')?.textContent?.trim()).toBe('S');
	});

	it('swaps a broken avatar for the initial', () => {
		const fixture = render({
			id: '1',
			username: 'alex',
			avatarUrl: AVATAR_URL
		});
		const element: HTMLElement = fixture.nativeElement;

		element.querySelector('img')!.dispatchEvent(new Event('error'));
		fixture.detectChanges();

		expect(element.querySelector('img')).toBeNull();
		expect(element.querySelector('.avatar')?.textContent?.trim()).toBe('A');
	});

	it('shows the avatar alone when told to hide the username', () => {
		TestBed.configureTestingModule({
			imports: [UserAvatarComponent],
			providers: [
				{
					provide: AuthService,
					useValue: { user: signal({ id: '1', username: 'steve' }) }
				}
			]
		});
		const fixture = TestBed.createComponent(UserAvatarComponent);
		fixture.componentRef.setInput('showUsername', false);
		fixture.detectChanges();
		const element: HTMLElement = fixture.nativeElement;

		expect(element.querySelector('.avatar')?.textContent?.trim()).toBe('S');
		expect(element.querySelector('.username')).toBeNull();
	});

	it('shows a generic icon and no name when nobody is logged in', () => {
		const element: HTMLElement = render(null).nativeElement;

		expect(element.querySelector('img')).toBeNull();
		expect(element.querySelector('mat-icon')?.textContent).toBe('person');
		expect(element.querySelector('.username')).toBeNull();
	});
});
