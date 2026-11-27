import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SessionUser } from 'src/app/core/api/api-responses';
import { AuthService } from 'src/app/core/auth/auth.service';
import { EditButton } from './edit-button';

describe('EditButton', () => {
	function render(user: SessionUser | null | undefined) {
		TestBed.configureTestingModule({
			imports: [EditButton],
			providers: [
				{ provide: AuthService, useValue: { user: signal(user) } }
			]
		});
		const fixture = TestBed.createComponent(EditButton);
		fixture.componentRef.setInput('type', 'gallery');
		fixture.componentRef.setInput('itemId', 'image 1');
		fixture.componentRef.setInput('itemName', 'Spawn walkway');
		fixture.detectChanges();
		return fixture.nativeElement.querySelector(
			'a'
		) as HTMLAnchorElement | null;
	}

	it('opens the item in its tool in a new tab, for an editor', () => {
		const link = render({ id: '1', username: 'editor' })!;

		expect(link.getAttribute('href')).toBe('/admin/gallery/image%201');
		expect(link.target).toBe('_blank');
		expect(link.textContent?.replace(/\s+/g, ' ').trim()).toBe(
			'edit Edit Spawn walkway (opens in new tab)'
		);
	});

	it('is hidden from visitors, and while the user is unknown (as on the server)', () => {
		expect(render(null)).toBeNull();
		TestBed.resetTestingModule();
		expect(render(undefined)).toBeNull();
	});
});
