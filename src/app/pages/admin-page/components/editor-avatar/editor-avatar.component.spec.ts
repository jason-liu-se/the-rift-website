import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditorRef } from 'src/app/interfaces/api-responses';
import { EditorAvatarComponent } from './editor-avatar.component';

describe('EditorAvatarComponent', () => {
	let fixture: ComponentFixture<EditorAvatarComponent>;
	const element = (): HTMLElement => fixture.nativeElement;

	function render(editor?: EditorRef) {
		TestBed.configureTestingModule({ imports: [EditorAvatarComponent] });
		fixture = TestBed.createComponent(EditorAvatarComponent);
		fixture.componentRef.setInput('editor', editor);
		fixture.detectChanges();
	}

	it('shows only the avatar, named by its alt text and tooltip', () => {
		render({ id: '1', username: 'editor', avatarUrl: 'https://cdn/a.png' });
		const image = element().querySelector('img')!;

		expect(image.getAttribute('src')).toBe('https://cdn/a.png');
		expect(image.alt).toBe('editor');
		expect(element().textContent?.trim()).toBe('');
	});

	it('shows the name when there is no avatar, or it fails to load', () => {
		render({ id: '1', username: 'editor' });
		expect(element().textContent?.trim()).toBe('editor');

		TestBed.resetTestingModule();
		render({
			id: '1',
			username: 'editor',
			avatarUrl: 'https://cdn/gone.png'
		});
		element().querySelector('img')!.dispatchEvent(new Event('error'));
		fixture.detectChanges();
		expect(element().querySelector('img')).toBeNull();
		expect(element().textContent?.trim()).toBe('editor');
	});

	it('says "unknown" for an item older than the edit history', () => {
		render(undefined);

		expect(element().textContent?.trim()).toBe('unknown');
	});
});
