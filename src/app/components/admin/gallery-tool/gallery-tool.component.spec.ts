import { TestBed } from '@angular/core/testing';
import { renderComponent } from 'src/app/testing/render-component';
import { GalleryToolComponent } from './gallery-tool.component';

describe('GalleryToolComponent', () => {
	it('previews a sample image with the gallery caption card', () => {
		TestBed.configureTestingModule({ imports: [GalleryToolComponent] });
		const fixture = renderComponent(GalleryToolComponent);
		const { preview } = fixture.componentInstance;
		const card: HTMLElement =
			fixture.nativeElement.querySelector('app-caption-card');
		expect(card.querySelector('img')?.getAttribute('src')).toBe(
			preview.url
		);
		expect(card.querySelector('.caption-text')?.textContent).toBe(
			preview.caption
		);
	});
});
