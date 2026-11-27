import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ItemThumbnail } from './item-thumbnail';

describe('ItemThumbnail', () => {
	let fixture: ComponentFixture<ItemThumbnail>;
	const element = (): HTMLElement => fixture.nativeElement;

	function render(src: string | undefined) {
		fixture = TestBed.createComponent(ItemThumbnail);
		fixture.componentRef.setInput('src', src);
		fixture.detectChanges();
	}

	it('shows the image', () => {
		render('https://i.imgur.com/a.png');

		expect(element().querySelector('img')?.src).toBe(
			'https://i.imgur.com/a.png'
		);
	});

	it('shows a placeholder without an image', () => {
		render('');

		expect(element().querySelector('img')).toBeNull();
		expect(element().querySelector('.placeholder')).not.toBeNull();
	});

	it('shows a placeholder when the image fails to load', () => {
		render('https://i.imgur.com/gone.png');

		element().querySelector('img')!.dispatchEvent(new Event('error'));
		fixture.detectChanges();

		expect(element().querySelector('.placeholder')).not.toBeNull();
	});
});
