import { IMAGE_LOADER } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { cloudflareImageLoader } from 'src/app/utilities/image-loaders';
import { OptimizedImageComponent } from './optimized-image.component';

const SRC = '/assets/a.webp';
const resized = (width: number) =>
	`/cdn-cgi/image/format=webp,width=${width},onerror=redirect/assets/a.webp`;

function render(inputs: Record<string, unknown> = {}): HTMLImageElement {
	const fixture = TestBed.createComponent(OptimizedImageComponent);
	for (const [name, value] of Object.entries({ src: SRC, ...inputs })) {
		fixture.componentRef.setInput(name, value);
	}
	fixture.detectChanges();
	return fixture.nativeElement.querySelector('img');
}

describe('OptimizedImageComponent', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [OptimizedImageComponent],
			providers: [
				{ provide: IMAGE_LOADER, useValue: cloudflareImageLoader }
			]
		});
	});

	it('offers the image resized to the mobile, tablet, and desktop widths', () => {
		const image = render();

		expect(image.getAttribute('srcset')).toBe(
			`${resized(480)} 480w, ${resized(960)} 960w, ${resized(1920)} 1920w`
		);
		expect(image.getAttribute('src')).toBe(SRC);
	});

	it('shows the original file when a resized version fails', () => {
		const image = render();

		image.dispatchEvent(new Event('error'));

		expect(image.hasAttribute('srcset')).toBe(false);
		expect(image.getAttribute('src')).toBe(SRC);
	});

	it('serves only the original file when original is set', () => {
		const image = render({ original: true });

		expect(image.getAttribute('srcset')).not.toContain('/cdn-cgi/');
		expect(image.getAttribute('src')).toBe(SRC);
	});

	it('lazy-loads by default', () => {
		const image = render();

		expect(image.getAttribute('loading')).toBe('lazy');
		expect(image.getAttribute('fetchpriority')).toBe('auto');
	});

	it('loads first when priority is set', () => {
		const image = render({ priority: true });

		expect(image.getAttribute('loading')).toBe('eager');
		expect(image.getAttribute('fetchpriority')).toBe('high');
	});

	it('is decorative unless given alt text', () => {
		expect(render().alt).toBe('');
		expect(render({ alt: 'A castle' }).alt).toBe('A castle');
	});

	it('emits the loaded file’s natural size', () => {
		const fixture = TestBed.createComponent(OptimizedImageComponent);
		fixture.componentRef.setInput('src', SRC);
		const sizes: unknown[] = [];
		fixture.componentInstance.loaded.subscribe((size) => sizes.push(size));
		fixture.detectChanges();
		const image: HTMLImageElement =
			fixture.nativeElement.querySelector('img');

		Object.defineProperty(image, 'naturalWidth', { value: 1920 });
		Object.defineProperty(image, 'naturalHeight', { value: 1080 });
		image.dispatchEvent(new Event('load'));

		expect(sizes).toEqual([{ width: 1920, height: 1080 }]);
	});

	it('emits no size for an image without intrinsic dimensions', () => {
		const fixture = TestBed.createComponent(OptimizedImageComponent);
		fixture.componentRef.setInput('src', SRC);
		const sizes: unknown[] = [];
		fixture.componentInstance.loaded.subscribe((size) => sizes.push(size));
		fixture.detectChanges();

		fixture.nativeElement
			.querySelector('img')
			.dispatchEvent(new Event('load'));

		expect(sizes).toEqual([]);
	});
});
