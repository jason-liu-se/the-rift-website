import { TestBed } from '@angular/core/testing';

import { ICaptionCard } from 'src/app/interfaces/slideshow-image.interface';
import { renderComponent } from 'src/app/testing/render-component';
import { ImageSlideshowComponent } from './image-slideshow.component';

const IMAGES: ICaptionCard[] = [
	{ url: 'assets/one.png', caption: 'One' },
	{ url: 'assets/two.png', caption: 'Two' },
	{ url: 'assets/three.png', caption: 'Three' }
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
		TestBed.configureTestingModule({ imports: [ImageSlideshowComponent] });
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
});
