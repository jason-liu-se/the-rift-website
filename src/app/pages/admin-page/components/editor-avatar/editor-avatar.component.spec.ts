import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditorRef } from 'src/app/core/api/api-responses';
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

	it('shows the avatar', () => {
		render({ id: '1', username: 'editor', avatarUrl: 'https://cdn/a.png' });

		expect(element().querySelector('img')?.getAttribute('src')).toBe(
			'https://cdn/a.png'
		);
	});

	it('shows a placeholder when the avatar fails to load', () => {
		render({
			id: '1',
			username: 'editor',
			avatarUrl: 'https://cdn/gone.png'
		});
		element().querySelector('img')!.dispatchEvent(new Event('error'));
		fixture.detectChanges();

		expect(element().querySelector('img')).toBeNull();
		expect(element().querySelector('.placeholder')).not.toBeNull();
	});

	it('shows a placeholder for an unknown editor', () => {
		render(undefined);

		expect(element().querySelector('.placeholder')).not.toBeNull();
	});
});
