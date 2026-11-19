import { IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { OPTIMIZED_IMAGE } from './image-fallback.directive';

@Component({
	imports: [OPTIMIZED_IMAGE],
	template: `<img ngSrc="/assets/a.webp" width="640" height="360" alt="" />`
})
class HostComponent {}

describe('ImageFallbackDirective', () => {
	function render(): HTMLImageElement {
		TestBed.configureTestingModule({
			imports: [HostComponent],
			providers: [
				{
					provide: IMAGE_LOADER,
					useValue: ({ src, width }: ImageLoaderConfig) =>
						width ? `/resized/${width}${src}` : src
				}
			]
		});
		const fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		return fixture.nativeElement.querySelector('img');
	}

	it('offers the resized versions while they load', () => {
		const image = render();

		expect(image.getAttribute('srcset')).toContain('/resized/640');
	});

	it('falls back to the original file when a resized version fails', () => {
		const image = render();

		image.dispatchEvent(new Event('error'));

		expect(image.hasAttribute('srcset')).toBe(false);
		expect(image.getAttribute('src')).toBe('/assets/a.webp');
	});
});
