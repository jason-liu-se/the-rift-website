import { IMAGE_LOADER } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { cloudflareImageLoader } from 'src/app/shared/utils/image-loaders';
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

	it('starts later images of a failed source on the original file', () => {
		const failed = '/assets/failed.webp';
		render({ src: failed }).dispatchEvent(new Event('error'));

		expect(render({ src: failed }).getAttribute('srcset')).not.toContain(
			'/cdn-cgi/'
		);
		expect(render().getAttribute('srcset')).toContain('/cdn-cgi/');
	});

	it('keeps its loader params when src changes to a failed source', () => {
		const failed = '/assets/failed.webp';
		render({ src: failed }).dispatchEvent(new Event('error'));
		const fixture = TestBed.createComponent(OptimizedImageComponent);
		fixture.componentRef.setInput('src', SRC);
		fixture.detectChanges();

		fixture.componentRef.setInput('src', failed);

		expect(() => fixture.detectChanges()).not.toThrow();
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
});
