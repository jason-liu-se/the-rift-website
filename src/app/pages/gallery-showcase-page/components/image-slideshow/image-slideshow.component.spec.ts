import { Clipboard } from '@angular/cdk/clipboard';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { GalleryImage } from 'src/app/interfaces/api-responses';
import { renderComponent } from 'src/app/testing/render-component';
import { ImageSlideshowComponent } from './image-slideshow.component';

const IMAGES: GalleryImage[] = [
	{ id: '1', imageUrl: 'assets/one.png', caption: 'One' },
	{ id: '2', imageUrl: 'assets/two.png', caption: 'Two' },
	{ id: '3', imageUrl: 'assets/three.png', caption: 'Three' }
];

function render(inputs: Partial<ImageSlideshowComponent> = {}) {
	const fixture = renderComponent(ImageSlideshowComponent, {
		captionedImages: IMAGES,
		...inputs
	});
	const element: HTMLElement = fixture.nativeElement;
	const prev = element.querySelector<HTMLButtonElement>('.prev')!;
	const next = element.querySelector<HTMLButtonElement>('.next')!;
	const caption = () => element.querySelector('.caption')?.textContent;
	const click = (button: HTMLButtonElement) => {
		button.click();
		fixture.detectChanges();
	};

	return { element, prev, next, caption, click };
}

describe('ImageSlideshowComponent', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [ImageSlideshowComponent],
			providers: [provideHttpClient()]
		});
	});

	it('shows the first image by default, with only Next enabled', () => {
		const { element, prev, next, caption } = render();
		const image = element.querySelector('img');

		expect(image?.getAttribute('src')).toBe('assets/one.png');
		expect(image?.alt).toBe('One');
		expect(caption()).toBe('One');
		expect(prev.disabled).toBe(true);
		expect(next.disabled).toBe(false);
	});

	it('starts on startingIndex', () => {
		const { prev, next, caption } = render({ startingIndex: 1 });

		expect(caption()).toBe('Two');
		expect(prev.disabled).toBe(false);
		expect(next.disabled).toBe(false);
	});

	it('disables Next when starting on the last image', () => {
		const { prev, next, caption } = render({ startingIndex: 2 });

		expect(caption()).toBe('Three');
		expect(prev.disabled).toBe(false);
		expect(next.disabled).toBe(true);
	});

	it('steps forward with Next until the last image', () => {
		const { prev, next, caption, click } = render();

		click(next);
		expect(caption()).toBe('Two');
		expect(prev.disabled).toBe(false);

		click(next);
		expect(caption()).toBe('Three');
		expect(next.disabled).toBe(true);
	});

	it('steps back with Prev until the first image', () => {
		const { prev, next, caption, click } = render({ startingIndex: 2 });

		click(prev);
		expect(caption()).toBe('Two');
		expect(next.disabled).toBe(false);

		click(prev);
		expect(caption()).toBe('One');
		expect(prev.disabled).toBe(true);
	});

	it('disables both buttons for a single image', () => {
		const { prev, next } = render({ captionedImages: [IMAGES[0]] });

		expect(prev.disabled).toBe(true);
		expect(next.disabled).toBe(true);
	});

	it('renders an empty slide with both buttons disabled when there are no images', () => {
		const { prev, next, caption } = render({ captionedImages: [] });

		expect(caption()).toBe('');
		expect(prev.disabled).toBe(true);
		expect(next.disabled).toBe(true);
	});

	it('copies the link of the image on show', () => {
		const copy = vi
			.spyOn(TestBed.inject(Clipboard), 'copy')
			.mockReturnValue(true);
		const { element, next, click } = render();
		const copyLink = () =>
			element.querySelector<HTMLButtonElement>(
				'app-image-actions button'
			)!;

		click(next);
		copyLink().click();

		expect(copy).toHaveBeenCalledWith(
			new URL('assets/two.png', document.baseURI).href
		);
	});

	it('sizes the viewer to the photo once it loads, 16:9 until then', () => {
		const { element } = render();
		const viewer = element.querySelector<HTMLElement>('.viewer')!;
		const image = viewer.querySelector('img')!;
		expect(viewer.style.getPropertyValue('--image-ratio')).toBe(
			`${16 / 9}`
		);

		Object.defineProperty(image, 'naturalWidth', { value: 1000 });
		Object.defineProperty(image, 'naturalHeight', { value: 2000 });
		image.dispatchEvent(new Event('load'));
		TestBed.tick();

		expect(viewer.style.getPropertyValue('--image-ratio')).toBe('0.5');
	});

	it('goes back to 16:9 for the next photo until it loads', () => {
		const { element, next, click } = render();
		const viewer = () => element.querySelector<HTMLElement>('.viewer')!;
		const image = viewer().querySelector('img')!;
		Object.defineProperty(image, 'naturalWidth', { value: 1000 });
		Object.defineProperty(image, 'naturalHeight', { value: 2000 });
		image.dispatchEvent(new Event('load'));

		click(next);

		expect(viewer().style.getPropertyValue('--image-ratio')).toBe(
			`${16 / 9}`
		);
	});
});
